/**
 * Feature Importance Tracking Service
 * Aggregates and tracks SHAP-based feature importance
 * 
 * Features:
 * - Global importance aggregation
 * - Importance trends over time
 * - Importance drift detection
 * - Top-K feature ranking
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, gte, lte, eq, desc, sql } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('FeatureImportance');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export interface IFeatureImportance {
    featureName: string;
    importance: number;         // Absolute mean SHAP value
    direction: 'positive' | 'negative' | 'mixed';
    consistency: number;        // How consistent is the direction (0-1)
    sampleCount: number;
    rank: number;
}

export interface IImportanceSnapshot {
    modelType: MLModelType;
    modelVersion: string;
    snapshotDate: Date;
    features: IFeatureImportance[];
    totalSamples: number;
}

export interface IImportanceTrend {
    featureName: string;
    dataPoints: Array<{
        date: Date;
        importance: number;
        rank: number;
    }>;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
}

export interface IImportanceDrift {
    featureName: string;
    previousImportance: number;
    currentImportance: number;
    absoluteChange: number;
    percentChange: number;
    rankChange: number;
    isSignificant: boolean;
}

// ==================== SERVICE ====================

export class FeatureImportanceService {
    private importanceHistory: Map<string, IImportanceSnapshot[]> = new Map();

    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Calculate global feature importance from recent predictions
     */
    async calculateImportance(
        modelType: MLModelType,
        days: number = 7
    ): Promise<IServiceResult<IImportanceSnapshot>> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

            // Fetch local explanations from predictions (contains feature contributions)
            const predictions = await this.db
                .select({
                    localExplanation: mlPredictions.localExplanation,
                    inputFeatures: mlPredictions.inputFeatures
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, startDate),
                    lte(mlPredictions.createdAt, endDate),
                    sql`${mlPredictions.localExplanation} IS NOT NULL`
                ))
                .limit(5000);

            if (predictions.length === 0) {
                return {
                    success: false,
                    error: 'No predictions with local explanations found'
                };
            }

            // Aggregate SHAP values per feature
            const featureStats = new Map<string, {
                sumAbsolute: number;
                sumSigned: number;
                count: number;
                positiveCount: number;
                negativeCount: number;
            }>();

            for (const pred of predictions) {
                const explanation = pred.localExplanation;
                const contributions = explanation?.contributions;
                if (!contributions) continue;

                for (const [feature, value] of Object.entries(contributions)) {
                    const stats = featureStats.get(feature) ?? {
                        sumAbsolute: 0,
                        sumSigned: 0,
                        count: 0,
                        positiveCount: 0,
                        negativeCount: 0
                    };

                    stats.sumAbsolute += Math.abs(value);
                    stats.sumSigned += value;
                    stats.count++;
                    if (value > 0) stats.positiveCount++;
                    if (value < 0) stats.negativeCount++;

                    featureStats.set(feature, stats);
                }
            }

            // Convert to importance list
            const features: IFeatureImportance[] = [];
            for (const [featureName, stats] of featureStats) {
                const importance = stats.sumAbsolute / stats.count;
                const avgSigned = stats.sumSigned / stats.count;

                let direction: IFeatureImportance['direction'];
                let consistency: number;

                if (stats.positiveCount > stats.count * 0.7) {
                    direction = 'positive';
                    consistency = stats.positiveCount / stats.count;
                } else if (stats.negativeCount > stats.count * 0.7) {
                    direction = 'negative';
                    consistency = stats.negativeCount / stats.count;
                } else {
                    direction = 'mixed';
                    consistency = Math.max(stats.positiveCount, stats.negativeCount) / stats.count;
                }

                features.push({
                    featureName,
                    importance,
                    direction,
                    consistency,
                    sampleCount: stats.count,
                    rank: 0 // Will be set after sorting
                });
            }

            // Sort and rank
            features.sort((a, b) => b.importance - a.importance);
            features.forEach((f, i) => { f.rank = i + 1; });

            const snapshot: IImportanceSnapshot = {
                modelType,
                modelVersion: 'latest', // Would get from registry
                snapshotDate: new Date(),
                features,
                totalSamples: predictions.length
            };

            // Store in history
            const key = modelType;
            const history = this.importanceHistory.get(key) ?? [];
            history.push(snapshot);
            if (history.length > 30) history.shift(); // Keep 30 snapshots
            this.importanceHistory.set(key, history);

            logger.info('Feature importance calculated', {
                modelType,
                featureCount: features.length,
                topFeature: features[0]?.featureName,
                samples: predictions.length
            });

            return { success: true, data: snapshot };

        } catch (error) {
            logger.error('Importance calculation failed', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Calculation failed'
            };
        }
    }

    /**
     * Get top-K most important features
     */
    async getTopFeatures(
        modelType: MLModelType,
        k: number = 10
    ): Promise<IServiceResult<IFeatureImportance[]>> {
        const result = await this.calculateImportance(modelType);
        if (!result.success || !result.data) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            data: result.data.features.slice(0, k)
        };
    }

    /**
     * Get importance trends for features
     */
    async getImportanceTrends(
        modelType: MLModelType,
        featureNames?: string[]
    ): Promise<IServiceResult<IImportanceTrend[]>> {
        const history = this.importanceHistory.get(modelType) ?? [];

        if (history.length < 2) {
            return {
                success: false,
                error: 'Not enough historical data for trends'
            };
        }

        // Get all features or specified ones
        const allFeatures = new Set<string>();
        for (const snapshot of history) {
            for (const f of snapshot.features) {
                if (!featureNames || featureNames.includes(f.featureName)) {
                    allFeatures.add(f.featureName);
                }
            }
        }

        const trends: IImportanceTrend[] = [];

        for (const featureName of allFeatures) {
            const dataPoints: IImportanceTrend['dataPoints'] = [];

            for (const snapshot of history) {
                const feature = snapshot.features.find(f => f.featureName === featureName);
                if (feature) {
                    dataPoints.push({
                        date: snapshot.snapshotDate,
                        importance: feature.importance,
                        rank: feature.rank
                    });
                }
            }

            if (dataPoints.length < 2) continue;

            // Calculate trend and volatility
            const importances = dataPoints.map(d => d.importance);
            const trend = this.calculateTrend(importances);
            const volatility = this.calculateVolatility(importances);

            trends.push({
                featureName,
                dataPoints,
                trend,
                volatility
            });
        }

        return { success: true, data: trends };
    }

    /**
     * Detect importance drift
     */
    async detectImportanceDrift(
        modelType: MLModelType,
        driftThreshold: number = 0.2
    ): Promise<IServiceResult<IImportanceDrift[]>> {
        const history = this.importanceHistory.get(modelType) ?? [];

        if (history.length < 2) {
            return {
                success: false,
                error: 'Not enough historical data for drift detection'
            };
        }

        const previous = history[history.length - 2];
        const current = history[history.length - 1];

        const previousMap = new Map(previous.features.map(f => [f.featureName, f]));
        const drifts: IImportanceDrift[] = [];

        for (const curr of current.features) {
            const prev = previousMap.get(curr.featureName);
            if (!prev) continue;

            const absoluteChange = curr.importance - prev.importance;
            const percentChange = prev.importance !== 0
                ? (absoluteChange / prev.importance) * 100
                : curr.importance !== 0 ? 100 : 0;
            const rankChange = prev.rank - curr.rank;
            const isSignificant = Math.abs(percentChange) > driftThreshold * 100;

            drifts.push({
                featureName: curr.featureName,
                previousImportance: prev.importance,
                currentImportance: curr.importance,
                absoluteChange,
                percentChange,
                rankChange,
                isSignificant
            });
        }

        // Sort by absolute change
        drifts.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));

        return { success: true, data: drifts };
    }

    // ==================== PRIVATE METHODS ====================

    private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
        if (values.length < 2) return 'stable';

        // Simple linear regression slope
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

        const avgValue = sumY / n;
        const threshold = avgValue * 0.05; // 5% of mean

        if (slope > threshold) return 'increasing';
        if (slope < -threshold) return 'decreasing';
        return 'stable';
    }

    private calculateVolatility(values: number[]): number {
        if (values.length < 2) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;

        return mean !== 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation
    }
}

// ==================== FACTORY ====================

export function createFeatureImportanceService(db: Database): FeatureImportanceService {
    return new FeatureImportanceService(db);
}
