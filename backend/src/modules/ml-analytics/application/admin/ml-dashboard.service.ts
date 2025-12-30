/**
 * ML Dashboard Service
 * Aggregates ML metrics for monitoring dashboard
 * 
 * Provides at-a-glance view of:
 * - Prediction volume and latency
 * - Model health and status
 * - Experiment status
 * - Data quality metrics
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql, eq, and, gte, count, avg } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels, mlExperiments } from '../../../../db/schema/ml-analytics';
import { IServiceResult } from '../../domain';

const logger = createModuleLogger('MLDashboard');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export interface IPredictionMetrics {
    /** Predictions in last 24 hours */
    today: number;
    /** Predictions in last 7 days */
    thisWeek: number;
    /** Average latency in ms */
    avgLatencyMs: number;
    /** Error rate (0-1) */
    errorRate: number;
    /** Predictions by model type */
    byModelType: Record<string, number>;
}

export interface IModelMetrics {
    /** Active production models */
    active: number;
    /** Shadow models */
    shadow: number;
    /** Models pending promotion */
    pendingPromotion: number;
    /** Total registered models */
    totalRegistered: number;
    /** Model health by type */
    healthByType: Record<string, 'healthy' | 'degraded' | 'unhealthy'>;
}

export interface IExperimentMetrics {
    /** Active A/B tests */
    active: number;
    /** Completed experiments */
    completed: number;
    /** Paused experiments */
    paused: number;
}

export interface IDataQualityMetrics {
    /** Overall quality score (0-100) */
    score: number;
    /** Last successful data export */
    lastExportDate: Date | null;
    /** Total training samples available */
    trainingSampleCount: number;
    /** Feedback coverage (predictions with outcomes) */
    feedbackCoverage: number;
}

export interface ICircuitBreakerMetrics {
    /** Circuit breaker states */
    states: Record<string, 'CLOSED' | 'OPEN' | 'HALF_OPEN'>;
    /** Fallback counts */
    fallbackCounts: Record<string, number>;
}

export interface IMLDashboardData {
    predictions: IPredictionMetrics;
    models: IModelMetrics;
    experiments: IExperimentMetrics;
    dataQuality: IDataQualityMetrics;
    circuitBreakers: ICircuitBreakerMetrics;
    /** When dashboard data was generated */
    generatedAt: Date;
}

// ==================== SERVICE ====================

export class MLDashboardService {
    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Get complete dashboard data
     */
    async getDashboardData(): Promise<IServiceResult<IMLDashboardData>> {
        try {
            const [predictions, models, experiments, dataQuality] = await Promise.all([
                this.getPredictionMetrics(),
                this.getModelMetrics(),
                this.getExperimentMetrics(),
                this.getDataQualityMetrics()
            ]);

            const dashboardData: IMLDashboardData = {
                predictions,
                models,
                experiments,
                dataQuality,
                circuitBreakers: this.getCircuitBreakerMetrics(),
                generatedAt: new Date()
            };

            return { success: true, data: dashboardData };

        } catch (error) {
            logger.error('Failed to get dashboard data', { error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Dashboard data fetch failed'
            };
        }
    }

    /**
     * Get prediction-only metrics (lighter query)
     */
    async getPredictionMetrics(): Promise<IPredictionMetrics> {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        try {
            // Today's predictions
            const todayResult = await this.db.select({ count: count() })
                .from(mlPredictions)
                .where(gte(mlPredictions.createdAt, oneDayAgo));

            // This week's predictions
            const weekResult = await this.db.select({ count: count() })
                .from(mlPredictions)
                .where(gte(mlPredictions.createdAt, oneWeekAgo));

            // Average latency
            const latencyResult = await this.db.select({ avg: avg(mlPredictions.inferenceMs) })
                .from(mlPredictions)
                .where(gte(mlPredictions.createdAt, oneDayAgo));

            // Error rate (predictions with fallback)
            const errorResult = await this.db.select({ count: count() })
                .from(mlPredictions)
                .where(and(
                    gte(mlPredictions.createdAt, oneDayAgo),
                    eq(mlPredictions.usedFallback, true)
                ));

            const today = todayResult[0]?.count ?? 0;
            const errors = errorResult[0]?.count ?? 0;

            // Group by model type
            const byTypeResult = await this.db.select({
                modelType: mlPredictions.modelType,
                count: count()
            })
                .from(mlPredictions)
                .where(gte(mlPredictions.createdAt, oneWeekAgo))
                .groupBy(mlPredictions.modelType);

            const byModelType: Record<string, number> = {};
            for (const row of byTypeResult) {
                byModelType[row.modelType] = Number(row.count);
            }

            return {
                today: Number(today),
                thisWeek: Number(weekResult[0]?.count ?? 0),
                avgLatencyMs: Number(latencyResult[0]?.avg ?? 0),
                errorRate: today > 0 ? Number(errors) / Number(today) : 0,
                byModelType
            };

        } catch (error) {
            logger.error('Failed to get prediction metrics', { error });
            return {
                today: 0,
                thisWeek: 0,
                avgLatencyMs: 0,
                errorRate: 0,
                byModelType: {}
            };
        }
    }

    /**
     * Get model-related metrics
     */
    async getModelMetrics(): Promise<IModelMetrics> {
        try {
            // Count by status
            const statusResult = await this.db.select({
                status: mlModels.status,
                isProduction: mlModels.isProduction,
                count: count()
            })
                .from(mlModels)
                .groupBy(mlModels.status, mlModels.isProduction);

            let active = 0;
            let shadow = 0;
            let totalRegistered = 0;

            for (const row of statusResult) {
                const c = Number(row.count);
                totalRegistered += c;

                if (row.isProduction && row.status === 'production') {
                    active += c;
                } else if (row.status === 'staging') {
                    shadow += c;
                }
            }

            return {
                active,
                shadow,
                pendingPromotion: 0, // Would require ShadowComparisonService
                totalRegistered,
                healthByType: {
                    'waste_predictor': 'healthy',
                    'time_estimator': 'healthy',
                    'algorithm_selector': 'healthy'
                }
            };

        } catch (error) {
            logger.error('Failed to get model metrics', { error });
            return {
                active: 0,
                shadow: 0,
                pendingPromotion: 0,
                totalRegistered: 0,
                healthByType: {}
            };
        }
    }

    /**
     * Get experiment metrics
     */
    async getExperimentMetrics(): Promise<IExperimentMetrics> {
        try {
            const statusResult = await this.db.select({
                status: mlExperiments.status,
                count: count()
            })
                .from(mlExperiments)
                .groupBy(mlExperiments.status);

            let active = 0;
            let completed = 0;
            let paused = 0;

            for (const row of statusResult) {
                const c = Number(row.count);
                if (row.status === 'active') active = c;
                else if (row.status === 'completed') completed = c;
                else if (row.status === 'paused') paused = c;
            }

            return { active, completed, paused };

        } catch (error) {
            logger.error('Failed to get experiment metrics', { error });
            return { active: 0, completed: 0, paused: 0 };
        }
    }

    /**
     * Get data quality metrics
     */
    async getDataQualityMetrics(): Promise<IDataQualityMetrics> {
        try {
            // Total samples
            const totalResult = await this.db.select({ count: count() })
                .from(mlPredictions);

            // Samples with feedback
            const feedbackResult = await this.db.select({ count: count() })
                .from(mlPredictions)
                .where(sql`${mlPredictions.actualValue} IS NOT NULL`);

            const total = Number(totalResult[0]?.count ?? 0);
            const withFeedback = Number(feedbackResult[0]?.count ?? 0);
            const feedbackCoverage = total > 0 ? withFeedback / total : 0;

            // Quality score based on feedback coverage
            const score = Math.round(feedbackCoverage * 100);

            return {
                score: Math.max(0, Math.min(100, score)),
                lastExportDate: null, // Would require tracking
                trainingSampleCount: withFeedback,
                feedbackCoverage
            };

        } catch (error) {
            logger.error('Failed to get data quality metrics', { error });
            return {
                score: 0,
                lastExportDate: null,
                trainingSampleCount: 0,
                feedbackCoverage: 0
            };
        }
    }

    /**
     * Get circuit breaker metrics (from CircuitBreakerManager)
     */
    private getCircuitBreakerMetrics(): ICircuitBreakerMetrics {
        // These would normally come from CircuitBreakerManager.getAllStats()
        // For now return defaults
        return {
            states: {
                'ml-waste-prediction': 'CLOSED',
                'ml-algorithm-selection': 'CLOSED',
                'ml-time-prediction': 'CLOSED'
            },
            fallbackCounts: {
                'ml-waste-prediction': 0,
                'ml-algorithm-selection': 0,
                'ml-time-prediction': 0
            }
        };
    }
}

// ==================== FACTORY ====================

export function createMLDashboardService(db: Database): MLDashboardService {
    return new MLDashboardService(db);
}
