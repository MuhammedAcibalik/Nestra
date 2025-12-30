/**
 * Experiment Service
 * Manages A/B testing experiments with single-flight caching
 */

import crypto from 'node:crypto';
import { eq, and, lte, or, isNull, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createModuleLogger } from '../../../../core/logger';
import { mlExperiments, MLExperiment } from '../../../../db/schema/ml-analytics';
import {
    IActiveExperiment,
    IExperimentConfig,
    IBucketingResult,
    IExperimentResolution,
    VariantType,
    ExperimentStatus
} from '../../domain';
import { IServiceResult } from '../../domain/ml.types';

const logger = createModuleLogger('ExperimentService');

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

// Cache entry structure
interface ICacheEntry {
    value: IActiveExperiment | null;
    expiresAt: number;
}

/**
 * ExperimentService
 * Handles A/B testing experiment resolution with single-flight caching
 */
export class ExperimentService {
    private readonly cache = new Map<string, ICacheEntry>();
    private readonly inFlight = new Map<string, Promise<IActiveExperiment | null>>();
    private readonly ttlMs: number;
    private readonly jitterMs: number;

    constructor(
        private readonly db: Database,
        options: { ttlMs?: number; jitterMs?: number } = {}
    ) {
        this.ttlMs = options.ttlMs ?? 60_000; // 60 seconds default
        this.jitterMs = options.jitterMs ?? 5_000; // 5 seconds jitter
    }

    // ==================== PUBLIC API ====================

    /**
     * Create a new experiment
     */
    async createExperiment(config: IExperimentConfig): Promise<IServiceResult<MLExperiment>> {
        try {
            const [experiment] = await this.db
                .insert(mlExperiments)
                .values({
                    modelType: config.modelType as 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor',
                    scopeType: config.scopeType,
                    scopeTenantId: config.scopeTenantId,
                    controlModelId: config.controlModelId,
                    variantModelId: config.variantModelId,
                    allocationBasisPoints: config.allocationBasisPoints,
                    salt: config.salt,
                    startDate: config.startDate ?? new Date(),
                    endDate: config.endDate
                })
                .returning();

            logger.info('Experiment created', { experimentId: experiment.id, modelType: config.modelType });
            return { success: true, data: experiment };
        } catch (error) {
            logger.error('Failed to create experiment', { error, config });
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `Failed to create experiment: ${message}` };
        }
    }

    /**
     * Update experiment status
     */
    async updateStatus(experimentId: string, status: ExperimentStatus): Promise<IServiceResult<MLExperiment>> {
        try {
            const [experiment] = await this.db
                .update(mlExperiments)
                .set({ status })
                .where(eq(mlExperiments.id, experimentId))
                .returning();

            if (!experiment) {
                return { success: false, error: 'Experiment not found' };
            }

            // Invalidate cache for this experiment's scope
            this.invalidateCache(experiment.modelType, experiment.scopeTenantId);

            logger.info('Experiment status updated', { experimentId, status });
            return { success: true, data: experiment };
        } catch (error) {
            logger.error('Failed to update experiment status', { error, experimentId, status });
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `Failed to update status: ${message}` };
        }
    }

    /**
     * Resolve experiment for a given context (with precedence and caching)
     */
    async resolveExperiment(
        modelType: string,
        unitKey: string,
        tenantId?: string | null
    ): Promise<IExperimentResolution> {
        // Get active experiment (cached)
        const experiment = await this.getActiveExperiment(modelType, tenantId);

        if (!experiment) {
            return {
                experiment: null,
                assignedVariant: null,
                unitKey
            };
        }

        // Determine variant via deterministic bucketing
        const bucketResult = this.bucket(experiment.salt, experiment.id, unitKey, experiment.allocationBasisPoints);

        return {
            experiment,
            assignedVariant: bucketResult.variant,
            unitKey
        };
    }

    /**
     * List all experiments (optionally filtered)
     */
    async listExperiments(filters?: { modelType?: string; status?: ExperimentStatus }): Promise<IServiceResult<MLExperiment[]>> {
        try {
            let query = this.db.select().from(mlExperiments);

            // Note: Drizzle doesn't support dynamic where chaining cleanly, 
            // so we build conditions manually
            const conditions: ReturnType<typeof eq>[] = [];

            if (filters?.modelType) {
                conditions.push(eq(mlExperiments.modelType, filters.modelType as 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor'));
            }
            if (filters?.status) {
                conditions.push(eq(mlExperiments.status, filters.status));
            }

            const experiments = conditions.length > 0
                ? await query.where(and(...conditions))
                : await query;

            return { success: true, data: experiments };
        } catch (error) {
            logger.error('Failed to list experiments', { error, filters });
            return { success: false, error: 'Failed to list experiments' };
        }
    }

    // ==================== CACHING ====================

    /**
     * Get active experiment with single-flight caching
     */
    private async getActiveExperiment(modelType: string, tenantId?: string | null): Promise<IActiveExperiment | null> {
        const cacheKey = this.buildCacheKey(modelType, tenantId);
        const now = Date.now();

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            return cached.value;
        }

        // Check if there's already a fetch in flight
        const existingFlight = this.inFlight.get(cacheKey);
        if (existingFlight) {
            return existingFlight;
        }

        // Start new fetch
        const fetchPromise = this.fetchActiveExperiment(modelType, tenantId);
        this.inFlight.set(cacheKey, fetchPromise);

        try {
            const result = await fetchPromise;

            // Calculate TTL with jitter to prevent thundering herd
            const jitter = Math.floor(Math.random() * this.jitterMs);
            const expiresAt = now + this.ttlMs + jitter;

            this.cache.set(cacheKey, { value: result, expiresAt });
            return result;
        } finally {
            this.inFlight.delete(cacheKey);
        }
    }

    /**
     * Fetch active experiment from DB with precedence logic
     * Precedence: Tenant-scoped > Global-scoped
     */
    private async fetchActiveExperiment(modelType: string, tenantId?: string | null): Promise<IActiveExperiment | null> {
        const now = new Date();

        try {
            // Query with precedence: tenant scope first, then global
            // Using raw SQL for complex ordering
            const experiments = await this.db
                .select()
                .from(mlExperiments)
                .where(
                    and(
                        eq(mlExperiments.status, 'active'),
                        eq(mlExperiments.modelType, modelType as 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor'),
                        lte(mlExperiments.startDate, now),
                        or(
                            isNull(mlExperiments.endDate),
                            sql`${mlExperiments.endDate} >= ${now}`
                        )
                    )
                )
                .limit(2); // Get up to 2 (one tenant, one global)

            if (experiments.length === 0) {
                return null;
            }

            // Apply precedence: prefer tenant-scoped if available
            let selectedExperiment: MLExperiment | null = null;

            for (const exp of experiments) {
                if (tenantId && exp.scopeType === 'tenant' && exp.scopeTenantId === tenantId) {
                    // Exact tenant match - highest priority
                    selectedExperiment = exp;
                    break;
                }
                if (exp.scopeType === 'global' && !selectedExperiment) {
                    // Global fallback
                    selectedExperiment = exp;
                }
            }

            if (!selectedExperiment) {
                return null;
            }

            return {
                id: selectedExperiment.id,
                modelType: selectedExperiment.modelType,
                experimentType: 'ab_test', // Default for traditional A/B tests
                scopeType: selectedExperiment.scopeType,
                scopeTenantId: selectedExperiment.scopeTenantId,
                controlModelId: selectedExperiment.controlModelId,
                variantModelId: selectedExperiment.variantModelId,
                allocationBasisPoints: selectedExperiment.allocationBasisPoints,
                salt: selectedExperiment.salt,
                startDate: selectedExperiment.startDate,
                endDate: selectedExperiment.endDate
            };
        } catch (error) {
            logger.error('Failed to fetch active experiment', { error, modelType, tenantId });
            return null;
        }
    }

    /**
     * Invalidate cache for a specific model/tenant combination
     */
    private invalidateCache(modelType: string, tenantId?: string | null): void {
        // Invalidate specific key
        const cacheKey = this.buildCacheKey(modelType, tenantId);
        this.cache.delete(cacheKey);

        // Also invalidate global if tenant-specific was invalidated
        if (tenantId) {
            const globalKey = this.buildCacheKey(modelType, null);
            this.cache.delete(globalKey);
        }

        logger.info('Cache invalidated', { modelType, tenantId });
    }

    private buildCacheKey(modelType: string, tenantId?: string | null): string {
        return `${modelType}:${tenantId ?? 'global'}`;
    }

    // ==================== BUCKETING ====================

    /**
     * Deterministic bucketing using SHA-256
     */
    private bucket(salt: string, experimentId: string, unitKey: string, allocationBps: number): IBucketingResult {
        const input = `${salt}:${experimentId}:${unitKey}`;
        const digest = crypto.createHash('sha256').update(input).digest();

        // Use first 8 bytes as BigInt for uniform distribution
        const value = digest.readBigUInt64BE(0);
        const bucket = Number(value % 10000n);

        const variant: VariantType = bucket < allocationBps ? 'variant' : 'control';

        return { bucket, variant };
    }
}
