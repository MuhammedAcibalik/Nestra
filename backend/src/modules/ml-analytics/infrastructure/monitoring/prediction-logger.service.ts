/**
 * Prediction Logger Service
 * Logs all ML predictions for monitoring and analysis
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gte, lte, desc, sql, avg, count } from 'drizzle-orm';
import {
    mlPredictions,
    mlModelPerformance,
    MLPrediction,
    NewMLPrediction,
    NewMLModelPerformance
} from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('PredictionLogger');

// ==================== TYPES ====================

export type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';

export interface IPredictionLogEntry {
    modelId?: string;
    modelType: MLModelType;
    modelVersion: string;
    inputFeatures: Record<string, number>;
    rawPrediction: number[];
    formattedPrediction?: Record<string, unknown>;
    confidence?: number;
    usedFallback?: boolean;
    preprocessingMs?: number;
    inferenceMs?: number;
    totalLatencyMs?: number;
    jobId?: string;
    scenarioId?: string;
    userId?: string;
    tenantId?: string;
    executionType?: 'primary' | 'shadow' | 'fallback';
    // A/B Testing fields
    experimentId?: string | null;
    assignedVariant?: 'control' | 'variant' | null;
    servedVariant?: 'control' | 'variant';
    latencyMs?: number;
    errorCode?: string;
}

export interface IPredictionStats {
    totalPredictions: number;
    fallbackCount: number;
    avgLatencyMs: number;
    avgConfidence: number;
    predictionsByType: Record<string, number>;
}

export interface IPredictionFilter {
    modelType?: MLModelType;
    modelVersion?: string;
    startDate?: Date;
    endDate?: Date;
    jobId?: string;
    tenantId?: string;
    usedFallback?: boolean;
}

// ==================== SERVICE ====================

export class PredictionLoggerService {
    constructor(private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }) { }

    /**
     * Log a prediction
     */
    async logPrediction(entry: IPredictionLogEntry): Promise<IServiceResult<MLPrediction>> {
        try {
            const newPrediction: NewMLPrediction = {
                id: uuid(),
                modelId: entry.modelId,
                modelType: entry.modelType,
                modelVersion: entry.modelVersion,
                inputFeatures: entry.inputFeatures,
                rawPrediction: entry.rawPrediction,
                formattedPrediction: entry.formattedPrediction,
                confidence: entry.confidence,
                usedFallback: entry.usedFallback ?? false,
                preprocessingMs: entry.preprocessingMs,
                inferenceMs: entry.inferenceMs,
                totalLatencyMs: entry.totalLatencyMs,
                jobId: entry.jobId,
                scenarioId: entry.scenarioId,
                userId: entry.userId,
                tenantId: entry.tenantId,
                executionType: entry.executionType ?? 'primary'
            };

            const [prediction] = await this.db
                .insert(mlPredictions)
                .values(newPrediction)
                .returning();

            return { success: true, data: prediction };
        } catch (error) {
            // Don't fail the main operation if logging fails
            logger.error('Failed to log prediction', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to log prediction'
            };
        }
    }

    /**
     * Log prediction (fire and forget - non-blocking)
     */
    logPredictionAsync(entry: IPredictionLogEntry): void {
        // Fire and forget - don't await
        this.logPrediction(entry).catch(err => {
            logger.error('Async prediction logging failed', { error: err });
        });
    }

    /**
     * Get predictions with filtering
     */
    async getPredictions(
        filter: IPredictionFilter = {},
        limit: number = 100,
        offset: number = 0
    ): Promise<IServiceResult<MLPrediction[]>> {
        try {
            const conditions = [];

            if (filter.modelType) {
                conditions.push(eq(mlPredictions.modelType, filter.modelType));
            }
            if (filter.modelVersion) {
                conditions.push(eq(mlPredictions.modelVersion, filter.modelVersion));
            }
            if (filter.jobId) {
                conditions.push(eq(mlPredictions.jobId, filter.jobId));
            }
            if (filter.tenantId) {
                conditions.push(eq(mlPredictions.tenantId, filter.tenantId));
            }
            if (filter.usedFallback !== undefined) {
                conditions.push(eq(mlPredictions.usedFallback, filter.usedFallback));
            }
            if (filter.startDate) {
                conditions.push(gte(mlPredictions.createdAt, filter.startDate));
            }
            if (filter.endDate) {
                conditions.push(lte(mlPredictions.createdAt, filter.endDate));
            }

            const query = this.db
                .select()
                .from(mlPredictions)
                .orderBy(desc(mlPredictions.createdAt))
                .limit(limit)
                .offset(offset);

            const predictions = conditions.length > 0
                ? await query.where(and(...conditions))
                : await query;

            return { success: true, data: predictions };
        } catch (error) {
            logger.error('Failed to get predictions', { error });
            return { success: false, error: 'Failed to get predictions' };
        }
    }

    /**
     * Get prediction statistics
     */
    async getStats(
        modelType?: MLModelType,
        startDate?: Date,
        endDate?: Date
    ): Promise<IServiceResult<IPredictionStats>> {
        try {
            const conditions = [];

            if (modelType) {
                conditions.push(eq(mlPredictions.modelType, modelType));
            }
            if (startDate) {
                conditions.push(gte(mlPredictions.createdAt, startDate));
            }
            if (endDate) {
                conditions.push(lte(mlPredictions.createdAt, endDate));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Get aggregated stats
            const [stats] = await this.db
                .select({
                    totalPredictions: count(),
                    fallbackCount: sql<number>`COUNT(*) FILTER (WHERE ${mlPredictions.usedFallback} = true)`,
                    avgLatencyMs: avg(mlPredictions.totalLatencyMs),
                    avgConfidence: avg(mlPredictions.confidence)
                })
                .from(mlPredictions)
                .where(whereClause);

            // Get counts by type
            const typeCounts = await this.db
                .select({
                    modelType: mlPredictions.modelType,
                    count: count()
                })
                .from(mlPredictions)
                .where(whereClause)
                .groupBy(mlPredictions.modelType);

            const predictionsByType: Record<string, number> = {};
            for (const tc of typeCounts) {
                predictionsByType[tc.modelType] = tc.count;
            }

            return {
                success: true,
                data: {
                    totalPredictions: stats.totalPredictions ?? 0,
                    fallbackCount: stats.fallbackCount ?? 0,
                    avgLatencyMs: Number(stats.avgLatencyMs) || 0,
                    avgConfidence: Number(stats.avgConfidence) || 0,
                    predictionsByType
                }
            };
        } catch (error) {
            logger.error('Failed to get prediction stats', { error });
            return { success: false, error: 'Failed to get stats' };
        }
    }

    /**
     * Submit feedback for a prediction (ground truth)
     */
    async submitFeedback(
        predictionId: string,
        actualValue: Record<string, unknown>,
        feedbackScore?: number
    ): Promise<IServiceResult<void>> {
        try {
            await this.db
                .update(mlPredictions)
                .set({
                    actualValue,
                    feedbackScore,
                    feedbackAt: new Date()
                })
                .where(eq(mlPredictions.id, predictionId));

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to submit feedback', { error });
            return { success: false, error: 'Failed to submit feedback' };
        }
    }

    /**
     * Aggregate daily performance metrics
     */
    async aggregateDailyPerformance(modelId: string, date: Date): Promise<IServiceResult<void>> {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const [aggregated] = await this.db
                .select({
                    predictionCount: count(),
                    fallbackCount: sql<number>`COUNT(*) FILTER (WHERE ${mlPredictions.usedFallback} = true)`,
                    avgLatencyMs: avg(mlPredictions.totalLatencyMs),
                    maxLatencyMs: sql<number>`MAX(${mlPredictions.totalLatencyMs})`,
                    avgConfidence: avg(mlPredictions.confidence),
                    minConfidence: sql<number>`MIN(${mlPredictions.confidence})`,
                    feedbackCount: sql<number>`COUNT(*) FILTER (WHERE ${mlPredictions.feedbackScore} IS NOT NULL)`,
                    avgFeedbackScore: sql<number>`AVG(${mlPredictions.feedbackScore})`
                })
                .from(mlPredictions)
                .where(
                    and(
                        eq(mlPredictions.modelId, modelId),
                        gte(mlPredictions.createdAt, startOfDay),
                        lte(mlPredictions.createdAt, endOfDay)
                    )
                );

            const performanceEntry: NewMLModelPerformance = {
                id: uuid(),
                modelId,
                date: startOfDay,
                predictionCount: aggregated.predictionCount ?? 0,
                fallbackCount: aggregated.fallbackCount ?? 0,
                avgLatencyMs: Number(aggregated.avgLatencyMs) || undefined,
                maxLatencyMs: aggregated.maxLatencyMs,
                avgConfidence: Number(aggregated.avgConfidence) || undefined,
                minConfidence: aggregated.minConfidence,
                feedbackCount: aggregated.feedbackCount ?? 0,
                avgFeedbackScore: aggregated.avgFeedbackScore
            };

            await this.db
                .insert(mlModelPerformance)
                .values(performanceEntry)
                .onConflictDoNothing();

            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to aggregate performance', { error });
            return { success: false, error: 'Failed to aggregate performance' };
        }
    }
}
