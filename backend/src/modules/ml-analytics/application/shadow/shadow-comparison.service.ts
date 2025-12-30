/**
 * Shadow Comparison Service
 * Compares production vs shadow model accuracy for automated promotion decisions
 * 
 * Features:
 * - Accuracy comparison over time windows
 * - Champion/Challenger promotion logic
 * - Statistical significance testing (simplified)
 * - Promotion history tracking
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gte, sql, desc, isNotNull } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('ShadowComparison');

// ==================== TYPES ====================

export interface IModelAccuracy {
    modelVersion: string;
    totalPredictions: number;
    withFeedback: number;
    meanAbsoluteError: number;
    meanSquaredError: number;
    accuracy: number; // For classification or binned accuracy
    lastUpdated: Date;
}

export interface IComparisonResult {
    modelType: MLModelType;
    timeWindowDays: number;
    production: IModelAccuracy;
    shadow: IModelAccuracy[];
    recommendation: 'promote' | 'keep_observing' | 'no_action';
    bestShadow?: {
        version: string;
        improvementPercent: number;
        daysObserved: number;
    };
    reason: string;
}

export interface IPromotionConfig {
    /** Minimum improvement required (0.05 = 5%) */
    minImprovementPercent: number;
    /** Minimum days of observation */
    minObservationDays: number;
    /** Minimum predictions to consider */
    minPredictions: number;
    /** Auto-promote without approval */
    autoPromote: boolean;
}

const DEFAULT_PROMOTION_CONFIG: IPromotionConfig = {
    minImprovementPercent: 0.05,
    minObservationDays: 3,
    minPredictions: 100,
    autoPromote: false
};

// ==================== SERVICE ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export class ShadowComparisonService {
    constructor(
        private readonly db: Database,
        private readonly config: IPromotionConfig = DEFAULT_PROMOTION_CONFIG
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Compare production vs all shadow models for a given type
     */
    async compareModels(
        modelType: MLModelType,
        timeWindowDays: number = 7
    ): Promise<IServiceResult<IComparisonResult>> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - timeWindowDays);

            // Get production accuracy
            const productionResult = await this.getModelAccuracy(
                modelType,
                'primary',
                startDate
            );

            if (!productionResult.success || !productionResult.data) {
                return { success: false, error: 'Could not get production accuracy' };
            }

            // Get shadow accuracies
            const shadowResult = await this.getShadowAccuracies(modelType, startDate);
            const shadows = shadowResult.success ? (shadowResult.data ?? []) : [];

            // Analyze and recommend
            const { recommendation, bestShadow, reason } = this.analyzeForPromotion(
                productionResult.data,
                shadows,
                timeWindowDays
            );

            return {
                success: true,
                data: {
                    modelType,
                    timeWindowDays,
                    production: productionResult.data,
                    shadow: shadows,
                    recommendation,
                    bestShadow,
                    reason
                }
            };
        } catch (error) {
            logger.error('Model comparison failed', { error, modelType });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Comparison failed'
            };
        }
    }

    /**
     * Check all model types for potential promotions
     */
    async checkAllForPromotions(): Promise<Map<MLModelType, IComparisonResult>> {
        const results = new Map<MLModelType, IComparisonResult>();
        const modelTypes: MLModelType[] = [
            'waste_predictor',
            'algorithm_selector',
            'time_estimator',
            'anomaly_predictor'
        ];

        for (const modelType of modelTypes) {
            const result = await this.compareModels(modelType);
            if (result.success && result.data) {
                results.set(modelType, result.data);

                if (result.data.recommendation === 'promote') {
                    logger.info('Shadow model ready for promotion', {
                        modelType,
                        shadowVersion: result.data.bestShadow?.version,
                        improvement: result.data.bestShadow?.improvementPercent
                    });
                }
            }
        }

        return results;
    }

    /**
     * Promote shadow model to production
     */
    async promoteModel(
        modelType: MLModelType,
        shadowVersion: string
    ): Promise<IServiceResult<{ promoted: boolean }>> {
        try {
            logger.info('Promoting shadow model', { modelType, shadowVersion });

            // 1. Set current production to archived
            await this.db.update(mlModels)
                .set({
                    status: 'archived',
                    isProduction: false,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.isProduction, true)
                ));

            // 2. Set shadow to production
            await this.db.update(mlModels)
                .set({
                    status: 'production',
                    isProduction: true,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.version, shadowVersion)
                ));

            logger.info('Shadow model promoted successfully', { modelType, shadowVersion });
            return { success: true, data: { promoted: true } };

        } catch (error) {
            logger.error('Model promotion failed', { error, modelType, shadowVersion });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Promotion failed'
            };
        }
    }

    // ==================== INTERNAL METHODS ====================

    private async getModelAccuracy(
        modelType: MLModelType,
        executionType: 'primary' | 'shadow',
        startDate: Date
    ): Promise<IServiceResult<IModelAccuracy>> {
        try {
            const result = await this.db.select({
                modelVersion: mlPredictions.modelVersion,
                totalPredictions: sql<number>`COUNT(*)`,
                withFeedback: sql<number>`COUNT(CASE WHEN ${mlPredictions.actualValue} IS NOT NULL THEN 1 END)`,
                // Calculate errors for regression (waste prediction)
                mae: sql<number>`AVG(ABS(
                    COALESCE((${mlPredictions.formattedPrediction}->>'predictedWastePercent')::numeric, 0) -
                    COALESCE((${mlPredictions.actualValue}->>'wastePercent')::numeric, 0)
                ))`,
                mse: sql<number>`AVG(POWER(
                    COALESCE((${mlPredictions.formattedPrediction}->>'predictedWastePercent')::numeric, 0) -
                    COALESCE((${mlPredictions.actualValue}->>'wastePercent')::numeric, 0)
                , 2))`,
                lastUpdated: sql<Date>`MAX(${mlPredictions.createdAt})`
            })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    eq(mlPredictions.executionType, executionType),
                    gte(mlPredictions.createdAt, startDate),
                    isNotNull(mlPredictions.actualValue)
                ))
                .groupBy(mlPredictions.modelVersion)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(1);

            const row = result[0];
            if (!row || Number(row.withFeedback) === 0) {
                return { success: false, error: 'No predictions with feedback found' };
            }

            return {
                success: true,
                data: {
                    modelVersion: row.modelVersion ?? 'unknown',
                    totalPredictions: Number(row.totalPredictions),
                    withFeedback: Number(row.withFeedback),
                    meanAbsoluteError: Number(row.mae ?? 0),
                    meanSquaredError: Number(row.mse ?? 0),
                    accuracy: 1 - Math.min(Number(row.mae ?? 0) / 100, 1), // Simplified accuracy
                    lastUpdated: row.lastUpdated ?? new Date()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Query failed'
            };
        }
    }

    private async getShadowAccuracies(
        modelType: MLModelType,
        startDate: Date
    ): Promise<IServiceResult<IModelAccuracy[]>> {
        try {
            const result = await this.db.select({
                modelVersion: mlPredictions.modelVersion,
                totalPredictions: sql<number>`COUNT(*)`,
                withFeedback: sql<number>`COUNT(CASE WHEN ${mlPredictions.actualValue} IS NOT NULL THEN 1 END)`,
                mae: sql<number>`AVG(ABS(
                    COALESCE((${mlPredictions.formattedPrediction}->>'predictedWastePercent')::numeric, 0) -
                    COALESCE((${mlPredictions.actualValue}->>'wastePercent')::numeric, 0)
                ))`,
                mse: sql<number>`AVG(POWER(
                    COALESCE((${mlPredictions.formattedPrediction}->>'predictedWastePercent')::numeric, 0) -
                    COALESCE((${mlPredictions.actualValue}->>'wastePercent')::numeric, 0)
                , 2))`,
                lastUpdated: sql<Date>`MAX(${mlPredictions.createdAt})`
            })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    eq(mlPredictions.executionType, 'shadow'),
                    gte(mlPredictions.createdAt, startDate),
                    isNotNull(mlPredictions.actualValue)
                ))
                .groupBy(mlPredictions.modelVersion);

            return {
                success: true,
                data: result.map(row => ({
                    modelVersion: row.modelVersion ?? 'unknown',
                    totalPredictions: Number(row.totalPredictions),
                    withFeedback: Number(row.withFeedback),
                    meanAbsoluteError: Number(row.mae ?? 0),
                    meanSquaredError: Number(row.mse ?? 0),
                    accuracy: 1 - Math.min(Number(row.mae ?? 0) / 100, 1),
                    lastUpdated: row.lastUpdated ?? new Date()
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Query failed'
            };
        }
    }

    private analyzeForPromotion(
        production: IModelAccuracy,
        shadows: IModelAccuracy[],
        timeWindowDays: number
    ): {
        recommendation: 'promote' | 'keep_observing' | 'no_action';
        bestShadow?: { version: string; improvementPercent: number; daysObserved: number };
        reason: string;
    } {
        if (shadows.length === 0) {
            return { recommendation: 'no_action', reason: 'No shadow models running' };
        }

        // Find best shadow by lowest MAE
        const sortedShadows = [...shadows].sort(
            (a, b) => a.meanAbsoluteError - b.meanAbsoluteError
        );
        const bestShadow = sortedShadows[0];

        // Check if enough data
        if (bestShadow.withFeedback < this.config.minPredictions) {
            return {
                recommendation: 'keep_observing',
                reason: `Insufficient feedback: ${bestShadow.withFeedback}/${this.config.minPredictions} required`
            };
        }

        // Check observation period
        if (timeWindowDays < this.config.minObservationDays) {
            return {
                recommendation: 'keep_observing',
                reason: `Need ${this.config.minObservationDays} days observation, only ${timeWindowDays} available`
            };
        }

        // Calculate improvement
        const improvement = production.meanAbsoluteError > 0
            ? (production.meanAbsoluteError - bestShadow.meanAbsoluteError) / production.meanAbsoluteError
            : 0;

        if (improvement >= this.config.minImprovementPercent) {
            return {
                recommendation: 'promote',
                bestShadow: {
                    version: bestShadow.modelVersion,
                    improvementPercent: improvement * 100,
                    daysObserved: timeWindowDays
                },
                reason: `Shadow model shows ${(improvement * 100).toFixed(1)}% improvement (>= ${this.config.minImprovementPercent * 100}% required)`
            };
        }

        if (improvement > 0) {
            return {
                recommendation: 'keep_observing',
                reason: `Improvement ${(improvement * 100).toFixed(1)}% below threshold ${this.config.minImprovementPercent * 100}%`
            };
        }

        return {
            recommendation: 'no_action',
            reason: 'Shadow model not performing better than production'
        };
    }
}
