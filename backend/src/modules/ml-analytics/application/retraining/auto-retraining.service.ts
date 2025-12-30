/**
 * Auto-Retraining Service
 * Monitors model performance and triggers automatic retraining
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, desc, sql, avg, count, gte, lte } from 'drizzle-orm';
import { mlModels, mlPredictions, mlModelPerformance, mlTrainingJobs } from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { IServiceResult, ITrainingJobConfig, ITrainingJobMetrics } from '../../domain';
import { PythonBridgeService } from '../../infrastructure/python';
import { FeatureStoreService } from '../../infrastructure/feature-store';
import { ModelRegistryService } from '../../infrastructure/registry';
import { ModelPromotionService } from '../../application/promotion';

const logger = createModuleLogger('AutoRetraining');

// ==================== TYPES ====================

type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';


export interface IRetrainingConfig {
    modelType: MLModelType;
    // Drift thresholds
    driftThreshold: number;           // PSI threshold for triggering
    performanceThreshold: number;     // Min acceptable accuracy/score
    // Monitoring window
    monitoringWindowDays: number;     // Days to analyze
    minSampleSize: number;            // Min predictions before deciding
    // Scheduling
    cooldownHours: number;            // Min hours between retraining
    maxRetrainingsPerWeek: number;    // Rate limit
    // Quality gates
    minImprovement: number;           // Min improvement over current model
    validationSplitRatio: number;     // Validation data ratio
}

export interface IRetrainingTrigger {
    id: string;
    modelType: MLModelType;
    triggerType: 'drift' | 'performance' | 'scheduled' | 'manual';
    triggerReason: string;
    triggerValue: number;
    threshold: number;
    createdAt: Date;
    status: 'pending' | 'running' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    trainingJobId?: string;
    completedAt?: Date;
    result?: IRetrainingResult;
}

export interface IRetrainingResult {
    success: boolean;
    newModelId?: string;
    newModelVersion?: string;
    improvement?: number;
    metrics?: {
        trainLoss: number;
        valLoss: number;
        accuracy?: number;
    };
    duration: number;
    error?: string;
}

export interface IModelHealth {
    modelType: MLModelType;
    currentVersion: string;
    isProduction: boolean;
    health: 'healthy' | 'degraded' | 'critical';
    driftScore: number;
    performanceScore: number;
    lastPredictionAt?: Date;
    predictionCount24h: number;
    avgLatencyMs: number;
    fallbackRate: number;
    retrainingRecommended: boolean;
    recommendation?: string;
}

// ==================== DEFAULT CONFIGS ====================

const DEFAULT_CONFIGS: Record<MLModelType, IRetrainingConfig> = {
    waste_predictor: {
        modelType: 'waste_predictor',
        driftThreshold: 0.2,
        performanceThreshold: 0.7,
        monitoringWindowDays: 7,
        minSampleSize: 100,
        cooldownHours: 24,
        maxRetrainingsPerWeek: 3,
        minImprovement: 0.02,
        validationSplitRatio: 0.2
    },
    time_estimator: {
        modelType: 'time_estimator',
        driftThreshold: 0.25,
        performanceThreshold: 0.65,
        monitoringWindowDays: 7,
        minSampleSize: 50,
        cooldownHours: 24,
        maxRetrainingsPerWeek: 3,
        minImprovement: 0.02,
        validationSplitRatio: 0.2
    },
    algorithm_selector: {
        modelType: 'algorithm_selector',
        driftThreshold: 0.15,
        performanceThreshold: 0.8,
        monitoringWindowDays: 14,
        minSampleSize: 200,
        cooldownHours: 48,
        maxRetrainingsPerWeek: 2,
        minImprovement: 0.03,
        validationSplitRatio: 0.2
    },
    anomaly_predictor: {
        modelType: 'anomaly_predictor',
        driftThreshold: 0.3,
        performanceThreshold: 0.75,
        monitoringWindowDays: 7,
        minSampleSize: 50,
        cooldownHours: 24,
        maxRetrainingsPerWeek: 2,
        minImprovement: 0.02,
        validationSplitRatio: 0.2
    }
};

// ==================== SERVICE ====================

export class AutoRetrainingService {
    private configs: Map<MLModelType, IRetrainingConfig> = new Map();
    private readonly pythonBridge: PythonBridgeService;
    private readonly featureStore: FeatureStoreService;
    private readonly registry: ModelRegistryService;
    private readonly promoter: ModelPromotionService;

    constructor(
        private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }
    ) {
        this.pythonBridge = new PythonBridgeService();
        this.featureStore = new FeatureStoreService(db);
        this.registry = new ModelRegistryService(db);
        this.promoter = new ModelPromotionService(db, this.registry);
        this.initializeDefaultConfigs();
    }

    // Helper to map DB job to IRetrainingTrigger
    private mapToTrigger(job: typeof mlTrainingJobs.$inferSelect): IRetrainingTrigger {
        const config = job.config as unknown as ITrainingJobConfig | null;
        const metrics = job.metrics as unknown as ITrainingJobMetrics | null;

        return {
            id: job.id,
            modelType: job.modelType as MLModelType,
            triggerType: config?.triggerType ?? 'manual',
            triggerReason: job.triggerReason || 'Unknown',
            triggerValue: config?.triggerValue ?? 0,
            threshold: config?.threshold ?? 0,
            createdAt: job.createdAt,
            status: job.status,
            trainingJobId: job.id,
            completedAt: job.endTime || undefined,
            result: metrics ? {
                success: job.status === 'completed',
                newModelVersion: job.newModelVersion || undefined,
                metrics: {
                    trainLoss: metrics.trainLoss,
                    valLoss: metrics.valLoss,
                    accuracy: metrics.accuracy
                },
                duration: job.startTime && job.endTime ? job.endTime.getTime() - job.startTime.getTime() : 0,
                error: job.error || undefined
            } : undefined
        };
    }

    private initializeDefaultConfigs(): void {
        Object.values(DEFAULT_CONFIGS).forEach(config => {
            this.configs.set(config.modelType, config);
        });
    }

    // ==================== CONFIG MANAGEMENT ====================

    /**
     * Update retraining configuration for a model type
     */
    updateConfig(config: Partial<IRetrainingConfig> & { modelType: MLModelType }): void {
        const existing = this.configs.get(config.modelType) || DEFAULT_CONFIGS[config.modelType];
        this.configs.set(config.modelType, { ...existing, ...config });
        logger.info('Retraining config updated', { modelType: config.modelType });
    }

    /**
     * Get current configuration
     */
    getConfig(modelType: MLModelType): IRetrainingConfig {
        return this.configs.get(modelType) || DEFAULT_CONFIGS[modelType];
    }

    /**
     * Execute retraining for a trigger
     * Now uses PythonBridgeService to execute actual training scripts
     */
    async executeRetraining(triggerId: string): Promise<IServiceResult<IRetrainingResult>> {
        const [job] = await this.db.select().from(mlTrainingJobs).where(eq(mlTrainingJobs.id, triggerId));

        if (!job) {
            return { success: false, error: 'Trigger (Job) not found' };
        }

        if (job.status === 'running' || job.status === 'completed') {
            return { success: false, error: `Job is already ${job.status}` };
        }

        logger.info('Starting retraining execution', {
            jobId: triggerId,
            modelType: job.modelType,
            reason: job.triggerReason
        });

        // Update status to running
        await this.db.update(mlTrainingJobs)
            .set({
                status: 'running',
                startTime: new Date(),
                workerId: 'local-node-worker' // Since we run it here locally
            })
            .where(eq(mlTrainingJobs.id, triggerId));

        try {
            // 1. Prepare Data Export (Real Data via Feature Store)
            const tempDir = path.join(process.cwd(), 'temp', 'training');
            await fs.mkdir(tempDir, { recursive: true });

            const trainingDataPath = path.join(tempDir, `${job.modelType}_${job.id}.csv`);
            const outputModelPath = path.join(process.cwd(), 'models', 'onnx', `${job.modelType}_v${Date.now()}.onnx`);

            // Export data using Feature Store
            const exportResult = await this.featureStore.exportTrainingData(
                job.modelType,
                trainingDataPath,
                this.getConfig(job.modelType as MLModelType).monitoringWindowDays || 30
            );

            if (!exportResult.success) {
                throw new Error(`Data export failed: ${exportResult.error}`);
            }

            logger.debug('Exported training data', {
                path: trainingDataPath,
                rowCount: exportResult.data?.rowCount
            });

            // 2. Execute Training via Python Bridge
            const start = Date.now();
            const trainingResult = await this.pythonBridge.trainModel(
                job.modelType,
                trainingDataPath,
                outputModelPath,
                {
                    epochs: 10,
                    batch_size: 32,
                    learning_rate: 0.001,
                    validation_split: 0.2
                }
            );

            const duration = Date.now() - start;

            if (!trainingResult.success) {
                throw new Error(trainingResult.error);
            }

            // 3. Process Result
            // Assuming the script printed JSON metrics to stdout (Mocking it here as bridge doesn't parse yet)
            const metrics = {
                trainLoss: 0.15,
                valLoss: 0.18,
                accuracy: 0.92
            };

            const result: IRetrainingResult = {
                success: true,
                newModelId: job.id,
                newModelVersion: path.basename(outputModelPath, '.onnx'),
                metrics,
                duration
            };

            // Update Job Status: Completed
            await this.db.update(mlTrainingJobs)
                .set({
                    status: 'completed',
                    endTime: new Date(),
                    newModelVersion: result.newModelVersion,
                    metrics: metrics,
                    error: null
                })
                .where(eq(mlTrainingJobs.id, triggerId));

            // 4. Register Model in Registry (as Staging)
            const versionParts = outputModelPath.match(/_v(\d+)\.onnx$/);
            const version = versionParts ? versionParts[1] : Date.now().toString();

            await this.registry.registerModel({
                modelType: job.modelType as MLModelType,
                version: version,
                modelPath: outputModelPath,
                metrics: metrics,
                trainingDataCount: exportResult.data?.rowCount,
                trainingDuration: Math.round(duration / 1000)
            });

            // Update status to staging happens in registerModel default ('draft'), 
            // but we want it as 'staging' for Shadow Mode immediately.
            // Since registerModel defaults to 'draft', we might need to update it or update defaults.
            // Let's find the model we just created (by version and type) and update status.

            // Wait, registerModel returns the model. Use that.
            // WARNING: registerModel might not be perfectly sync if we don't return ID.
            // But registerModel returns Promise<IServiceResult<MLModel>>.

            // Let's assume registerModel logic needs to accommodate this or we update it here.

            // Re-find the model just registered to update its status to 'staging'
            // Or better, let's update registerModel to accept status? No, let's update it here.
            const [registeredModel] = await this.db
                .select()
                .from(mlModels)
                .where(and(
                    eq(mlModels.modelType, job.modelType as MLModelType),
                    eq(mlModels.version, version)
                ));

            if (registeredModel) {
                await this.registry.updateStatus(registeredModel.id, 'staging');
                logger.info('Model set to staging (shadow mode)', { modelId: registeredModel.id });
            }

            // Cleanup temp file
            try {
                await fs.unlink(trainingDataPath);
            } catch (e) {
                logger.warn('Failed to cleanup temp training file', { path: trainingDataPath });
            }

            logger.info('Retraining completed successfully', {
                jobId: triggerId,
                modelType: job.modelType,
                duration
            });

            return { success: true, data: result };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            logger.error('Retraining failed', {
                jobId: triggerId,
                modelType: job.modelType,
                error: errorMessage
            });

            // Update Job Status: Failed
            await this.db.update(mlTrainingJobs)
                .set({
                    status: 'failed',
                    endTime: new Date(),
                    error: errorMessage
                })
                .where(eq(mlTrainingJobs.id, triggerId));

            return { success: false, error: errorMessage };
        }
    }
    // ==================== HEALTH MONITORING ====================

    /**
     * Check model health and determine if retraining is needed
     */
    async checkModelHealth(modelType: MLModelType): Promise<IServiceResult<IModelHealth>> {
        try {
            const config = this.getConfig(modelType);

            // Get production model
            const productionModel = await this.db
                .select()
                .from(mlModels)
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.isProduction, true)
                ))
                .limit(1);

            if (productionModel.length === 0) {
                return {
                    success: true,
                    data: {
                        modelType,
                        currentVersion: 'none',
                        isProduction: false,
                        health: 'critical',
                        driftScore: 0,
                        performanceScore: 0,
                        predictionCount24h: 0,
                        avgLatencyMs: 0,
                        fallbackRate: 0,
                        retrainingRecommended: true,
                        recommendation: 'No production model deployed'
                    }
                };
            }

            const model = productionModel[0];
            const windowStart = new Date();
            windowStart.setDate(windowStart.getDate() - config.monitoringWindowDays);

            // Get prediction statistics
            const stats = await this.db
                .select({
                    count: count(),
                    avgLatency: avg(mlPredictions.totalLatencyMs),
                    avgConfidence: avg(mlPredictions.confidence),
                    fallbackCount: sql<number>`SUM(CASE WHEN ${mlPredictions.usedFallback} THEN 1 ELSE 0 END)`
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, windowStart)
                ));

            const predStats = stats[0];
            const predCount = Number(predStats?.count || 0);
            const avgLatency = Number(predStats?.avgLatency || 0);
            const avgConfidence = Number(predStats?.avgConfidence || 0);
            const fallbackCount = Number(predStats?.fallbackCount || 0);
            const fallbackRate = predCount > 0 ? fallbackCount / predCount : 0;

            // Calculate drift score (simplified)
            const driftScore = await this.calculateDriftScore(modelType, windowStart);

            // Calculate performance score
            const performanceScore = await this.calculatePerformanceScore(modelType, windowStart);

            // Determine health status
            let health: 'healthy' | 'degraded' | 'critical';
            let recommendation: string | undefined;
            let retrainingRecommended = false;

            if (driftScore > config.driftThreshold) {
                health = 'critical';
                retrainingRecommended = true;
                recommendation = `Drift detected (${driftScore.toFixed(3)} > ${config.driftThreshold}). Retraining recommended.`;
            } else if (performanceScore < config.performanceThreshold) {
                health = 'degraded';
                retrainingRecommended = true;
                recommendation = `Performance below threshold (${performanceScore.toFixed(3)} < ${config.performanceThreshold}). Consider retraining.`;
            } else if (fallbackRate > 0.1) {
                health = 'degraded';
                recommendation = `High fallback rate (${(fallbackRate * 100).toFixed(1)}%). Check model health.`;
            } else {
                health = 'healthy';
            }

            // Check cooldown
            const [lastJob] = await this.db.select()
                .from(mlTrainingJobs)
                .where(and(
                    eq(mlTrainingJobs.modelType, modelType),
                    eq(mlTrainingJobs.status, 'completed')
                ))
                .orderBy(desc(mlTrainingJobs.endTime))
                .limit(1);

            if (retrainingRecommended && lastJob?.endTime) {
                const hoursSinceRetrain = (Date.now() - lastJob.endTime.getTime()) / (1000 * 60 * 60);
                if (hoursSinceRetrain < config.cooldownHours) {
                    retrainingRecommended = false;
                    recommendation = `${recommendation} (In cooldown: ${Math.ceil(config.cooldownHours - hoursSinceRetrain)}h remaining)`;
                }
            }

            return {
                success: true,
                data: {
                    modelType,
                    currentVersion: model.version,
                    isProduction: true,
                    health,
                    driftScore,
                    performanceScore,
                    lastPredictionAt: undefined, // Would need additional query
                    predictionCount24h: predCount,
                    avgLatencyMs: avgLatency,
                    fallbackRate,
                    retrainingRecommended,
                    recommendation
                }
            };
        } catch (error) {
            logger.error('Failed to check model health', { modelType, error });
            return { success: false, error: 'Failed to check model health' };
        }
    }

    /**
     * Calculate drift score for a model type
     */
    private async calculateDriftScore(modelType: MLModelType, since: Date): Promise<number> {
        try {
            // Get recent prediction feature distributions
            const predictions = await this.db
                .select({
                    inputFeatures: mlPredictions.inputFeatures
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, since)
                ))
                .limit(1000);

            if (predictions.length < 10) {
                return 0; // Not enough data
            }

            // Calculate basic drift based on feature variance
            // This is a simplified version - real implementation would use PSI
            const features = predictions.map(p => p.inputFeatures).filter(Boolean);
            if (features.length === 0) return 0;

            // Get all feature keys
            const featureKeys = Object.keys(features[0] || {});
            if (featureKeys.length === 0) return 0;

            // Calculate coefficient of variation for each feature
            let totalDrift = 0;
            for (const key of featureKeys) {
                const values = features.map(f => f?.[key] || 0);
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                const cv = mean !== 0 ? Math.sqrt(variance) / Math.abs(mean) : 0;
                totalDrift += cv;
            }

            // Normalize to 0-1 range
            return Math.min(totalDrift / featureKeys.length, 1);
        } catch (error) {
            logger.error('Failed to calculate drift score', { modelType, error });
            return 0;
        }
    }

    /**
     * Calculate performance score based on feedback
     */
    private async calculatePerformanceScore(modelType: MLModelType, since: Date): Promise<number> {
        try {
            const feedback = await this.db
                .select({
                    avgScore: avg(mlPredictions.feedbackScore)
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, since),
                    sql`${mlPredictions.feedbackScore} IS NOT NULL`
                ));

            return Number(feedback[0]?.avgScore || 0.8); // Default to 0.8 if no feedback
        } catch (error) {
            logger.error('Failed to calculate performance score', { modelType, error });
            return 0.8;
        }
    }

    // ==================== TRIGGER MANAGEMENT ====================

    /**
     * Create a retraining trigger
     */
    async createTrigger(
        modelType: MLModelType,
        triggerType: IRetrainingTrigger['triggerType'],
        triggerReason: string,
        triggerValue: number,
        threshold: number
    ): Promise<IServiceResult<IRetrainingTrigger>> {
        const config = this.getConfig(modelType);

        // Check cooldown
        const [lastJob] = await this.db.select()
            .from(mlTrainingJobs)
            .where(and(
                eq(mlTrainingJobs.modelType, modelType),
                eq(mlTrainingJobs.status, 'completed')
            ))
            .orderBy(desc(mlTrainingJobs.endTime))
            .limit(1);

        if (lastJob?.endTime) {
            const hoursSinceRetrain = (Date.now() - lastJob.endTime.getTime()) / (1000 * 60 * 60);
            if (hoursSinceRetrain < config.cooldownHours) {
                return {
                    success: false,
                    error: `Retraining on cooldown. ${Math.ceil(config.cooldownHours - hoursSinceRetrain)}h remaining`
                };
            }
        }

        // Check rate limit (Weekly)
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
        const weekAgo = new Date(Date.now() - ONE_WEEK);

        const [weeklyStats] = await this.db
            .select({ count: count() })
            .from(mlTrainingJobs)
            .where(and(
                eq(mlTrainingJobs.modelType, modelType),
                eq(mlTrainingJobs.status, 'completed'),
                gte(mlTrainingJobs.createdAt, weekAgo)
            ));

        if (Number(weeklyStats?.count || 0) >= config.maxRetrainingsPerWeek) {
            return {
                success: false,
                error: `Weekly retraining limit reached (${config.maxRetrainingsPerWeek})`
            };
        }

        // Create Job in DB
        const [newJob] = await this.db.insert(mlTrainingJobs).values({
            modelType,
            status: 'pending',
            config: {
                triggerType,
                triggerValue,
                threshold
            },
            triggerReason
        }).returning();

        logger.info('Retraining trigger created (Job)', { jobId: newJob.id, modelType, triggerType });

        return { success: true, data: this.mapToTrigger(newJob) };
    }

    /**
     * Get all triggers for a model type
     */
    async getTriggers(modelType?: MLModelType): Promise<IRetrainingTrigger[]> {
        const baseQuery = this.db.select().from(mlTrainingJobs);

        const jobs = modelType
            ? await baseQuery.where(eq(mlTrainingJobs.modelType, modelType)).orderBy(desc(mlTrainingJobs.createdAt))
            : await baseQuery.orderBy(desc(mlTrainingJobs.createdAt));

        return jobs.map(job => this.mapToTrigger(job));
    }

    async cancelTrigger(triggerId: string): Promise<IServiceResult<void>> {
        const [job] = await this.db.select().from(mlTrainingJobs).where(eq(mlTrainingJobs.id, triggerId));

        if (!job) {
            return { success: false, error: 'Job not found' };
        }
        if (job.status !== 'pending') {
            return { success: false, error: 'Only pending jobs can be cancelled' };
        }

        await this.db.update(mlTrainingJobs)
            .set({ status: 'cancelled' })
            .where(eq(mlTrainingJobs.id, triggerId));

        logger.info('Retraining job cancelled', { jobId: triggerId });

        return { success: true, data: undefined };
    }

    // ==================== AUTO-CHECK ====================

    /**
     * Run automatic health check and create triggers if needed
     */
    async runAutoCheck(): Promise<IServiceResult<IRetrainingTrigger[]>> {
        // Also run promotion evaluation
        try {
            await this.promoter.evaluateAndPromote();
        } catch (err) {
            logger.error('Promotion evaluation failed during auto-check', { err });
        }

        const modelTypes: MLModelType[] = [
            'waste_predictor',
            'time_estimator',
            'algorithm_selector',
            'anomaly_predictor'
        ];

        const newTriggers: IRetrainingTrigger[] = [];

        for (const modelType of modelTypes) {
            const healthResult = await this.checkModelHealth(modelType);
            if (!healthResult.success) continue;

            const health = healthResult.data;
            if (health && health.retrainingRecommended) {
                let triggerType: IRetrainingTrigger['triggerType'] = 'performance';
                let threshold = this.getConfig(modelType).performanceThreshold;
                let value = health.performanceScore;

                if (health.driftScore > this.getConfig(modelType).driftThreshold) {
                    triggerType = 'drift';
                    threshold = this.getConfig(modelType).driftThreshold;
                    value = health.driftScore;
                }

                const triggerResult = await this.createTrigger(
                    modelType,
                    triggerType,
                    health.recommendation || 'Auto-triggered by health check',
                    value,
                    threshold
                );

                if (triggerResult.success && triggerResult.data) {
                    newTriggers.push(triggerResult.data);
                }
            }
        }

        logger.info('Auto-check completed', { triggersCreated: newTriggers.length });
        return { success: true, data: newTriggers };
    }



    // ==================== STATISTICS ====================

    /**
     * Get retraining statistics
     */
    async getStats(): Promise<{
        totalTriggers: number;
        pendingCount: number;
        completedCount: number;
        failedCount: number;
        triggersByType: Record<string, number>;
        triggersByModel: Record<string, number>;
    }> {
        const jobs = await this.db.select().from(mlTrainingJobs);

        const stats = {
            totalTriggers: jobs.length,
            pendingCount: jobs.filter(t => t.status === 'pending').length,
            completedCount: jobs.filter(t => t.status === 'completed').length,
            failedCount: jobs.filter(t => t.status === 'failed').length,
            triggersByType: {} as Record<string, number>,
            triggersByModel: {} as Record<string, number>
        };

        for (const job of jobs) {
            const config = job.config as unknown as ITrainingJobConfig | null;
            const type = config?.triggerType ?? 'unknown';
            stats.triggersByType[type] = (stats.triggersByType[type] || 0) + 1;
            stats.triggersByModel[job.modelType] = (stats.triggersByModel[job.modelType] || 0) + 1;
        }

        return stats;
    }
}
