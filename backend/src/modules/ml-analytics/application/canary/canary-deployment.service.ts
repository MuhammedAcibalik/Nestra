/**
 * Canary Deployment Service
 * Progressive traffic rollout for new model versions
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { mlExperiments } from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import {
    VariantType,
    CanaryStage,
    ICanaryState,
    ICanaryConfig,
    CANARY_TRAFFIC_MAP,
    IActiveExperiment
} from '../../domain';

const logger = createModuleLogger('CanaryDeployment');

// ==================== TYPES ====================

type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

const STAGE_ORDER: CanaryStage[] = ['initial', 'ramp_1', 'ramp_5', 'ramp_25', 'ramp_50', 'full'];

// ==================== DEFAULT CONFIG ====================

export const DEFAULT_CANARY_CONFIG: ICanaryConfig = {
    errorThreshold: 0.05,        // 5% error rate triggers rollback
    minSamplesPerStage: 100,     // Need 100 samples per stage
    autoAdvance: true,           // Auto-advance when healthy
    advanceDelayMs: 5 * 60 * 1000 // 5 minutes between stages
};

// ==================== SERVICE ====================

export class CanaryDeploymentService {
    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) { }

    // ==================== CANARY LIFECYCLE ====================

    /**
     * Start a new canary deployment
     */
    async startCanary(
        experimentId: string,
        config: Partial<ICanaryConfig> = {}
    ): Promise<IServiceResult<ICanaryState>> {
        try {
            const mergedConfig = { ...DEFAULT_CANARY_CONFIG, ...config };
            const now = new Date();

            const state: ICanaryState = {
                stage: 'ramp_1',
                trafficBasisPoints: CANARY_TRAFFIC_MAP['ramp_1'],
                errorThreshold: mergedConfig.errorThreshold,
                samplesInStage: 0,
                errorsInStage: 0,
                currentErrorRate: 0,
                startedAt: now,
                lastStageChange: now
            };

            await this.updateCanaryState(experimentId, state);

            logger.info('Canary deployment started', {
                experimentId,
                stage: state.stage,
                trafficPercent: state.trafficBasisPoints / 100
            });

            return { success: true, data: state };
        } catch (error) {
            logger.error('Failed to start canary', { experimentId, error });
            return { success: false, error: 'Failed to start canary deployment' };
        }
    }

    /**
     * Record a sample outcome (success or failure)
     */
    async recordSample(
        experimentId: string,
        isError: boolean
    ): Promise<IServiceResult<ICanaryState>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment?.canaryState) {
                return { success: false, error: 'Canary not active' };
            }

            const state = { ...experiment.canaryState };

            state.samplesInStage += 1;
            if (isError) {
                state.errorsInStage += 1;
            }
            state.currentErrorRate = state.errorsInStage / state.samplesInStage;

            // Check if we should rollback
            if (state.currentErrorRate > state.errorThreshold && state.samplesInStage >= 10) {
                return this.rollback(experimentId, `Error rate ${(state.currentErrorRate * 100).toFixed(1)}% exceeded threshold`);
            }

            await this.updateCanaryState(experimentId, state);

            return { success: true, data: state };
        } catch (error) {
            logger.error('Failed to record sample', { experimentId, error });
            return { success: false, error: 'Failed to record sample' };
        }
    }

    /**
     * Advance to the next stage
     */
    async advanceStage(experimentId: string): Promise<IServiceResult<ICanaryState>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment?.canaryState) {
                return { success: false, error: 'Canary not active' };
            }

            const state = { ...experiment.canaryState };
            const currentIndex = STAGE_ORDER.indexOf(state.stage);

            if (currentIndex === -1 || currentIndex >= STAGE_ORDER.length - 1) {
                return { success: false, error: 'Cannot advance: already at final stage or rolled back' };
            }

            const nextStage = STAGE_ORDER[currentIndex + 1];
            const now = new Date();

            state.stage = nextStage;
            state.trafficBasisPoints = CANARY_TRAFFIC_MAP[nextStage];
            state.samplesInStage = 0;
            state.errorsInStage = 0;
            state.currentErrorRate = 0;
            state.lastStageChange = now;

            if (nextStage === 'full') {
                state.promotedAt = now;
                logger.info('Canary promoted to full traffic', { experimentId });
            }

            await this.updateCanaryState(experimentId, state);

            logger.info('Canary advanced', {
                experimentId,
                stage: nextStage,
                trafficPercent: state.trafficBasisPoints / 100
            });

            return { success: true, data: state };
        } catch (error) {
            logger.error('Failed to advance stage', { experimentId, error });
            return { success: false, error: 'Failed to advance stage' };
        }
    }

    /**
     * Rollback the canary deployment
     */
    async rollback(
        experimentId: string,
        reason: string
    ): Promise<IServiceResult<ICanaryState>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment?.canaryState) {
                return { success: false, error: 'Canary not active' };
            }

            const now = new Date();
            const state: ICanaryState = {
                ...experiment.canaryState,
                stage: 'rolled_back',
                trafficBasisPoints: 0,
                rolledBackAt: now,
                rollbackReason: reason
            };

            await this.updateCanaryState(experimentId, state);

            logger.warn('Canary rolled back', { experimentId, reason });

            return { success: true, data: state };
        } catch (error) {
            logger.error('Failed to rollback', { experimentId, error });
            return { success: false, error: 'Failed to rollback' };
        }
    }

    /**
     * Check health and auto-advance if eligible
     */
    async checkAndAdvance(
        experimentId: string,
        config: ICanaryConfig = DEFAULT_CANARY_CONFIG
    ): Promise<IServiceResult<{ action: 'none' | 'advanced' | 'rolled_back'; state: ICanaryState }>> {
        try {
            const experiment = await this.getExperiment(experimentId);
            if (!experiment?.canaryState) {
                return { success: false, error: 'Canary not active' };
            }

            const state = experiment.canaryState;

            // Already completed
            if (state.stage === 'full' || state.stage === 'rolled_back') {
                return { success: true, data: { action: 'none', state } };
            }

            // Check for rollback
            if (state.currentErrorRate > state.errorThreshold && state.samplesInStage >= 10) {
                const result = await this.rollback(experimentId, 'Auto-rollback due to high error rate');
                if (result.success) {
                    return { success: true, data: { action: 'rolled_back', state: result.data } };
                }
                return result;
            }

            // Check for advancement
            const timeSinceChange = Date.now() - new Date(state.lastStageChange).getTime();
            const canAdvance = config.autoAdvance &&
                state.samplesInStage >= config.minSamplesPerStage &&
                timeSinceChange >= config.advanceDelayMs &&
                state.currentErrorRate <= state.errorThreshold;

            if (canAdvance) {
                const result = await this.advanceStage(experimentId);
                if (result.success) {
                    return { success: true, data: { action: 'advanced', state: result.data } };
                }
                return result;
            }

            return { success: true, data: { action: 'none', state } };
        } catch (error) {
            logger.error('Failed to check and advance', { experimentId, error });
            return { success: false, error: 'Failed to check and advance' };
        }
    }

    /**
     * Get current traffic allocation for canary
     */
    shouldRouteToVariant(state: ICanaryState | undefined, bucket: number): boolean {
        if (!state || state.stage === 'rolled_back') {
            return false;
        }

        // bucket is 0-9999, trafficBasisPoints is target percentage * 100
        return bucket < state.trafficBasisPoints;
    }

    // ==================== HELPERS ====================

    private async getExperiment(experimentId: string): Promise<IActiveExperiment | null> {
        const rows = await this.db
            .select()
            .from(mlExperiments)
            .where(eq(mlExperiments.id, experimentId))
            .limit(1);

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            modelType: row.modelType,
            experimentType: 'canary',
            scopeType: row.scopeType,
            scopeTenantId: row.scopeTenantId,
            controlModelId: row.controlModelId,
            variantModelId: row.variantModelId,
            allocationBasisPoints: row.allocationBasisPoints,
            salt: row.salt,
            startDate: row.startDate,
            endDate: row.endDate,
            canaryState: (row as Record<string, unknown>).canaryState as ICanaryState | undefined
        };
    }

    private async updateCanaryState(experimentId: string, state: ICanaryState): Promise<void> {
        await this.db.update(mlExperiments)
            .set({ canaryState: state } as Record<string, unknown>)
            .where(eq(mlExperiments.id, experimentId));
        logger.debug('Canary state persisted', { experimentId, stage: state.stage });
    }
}
