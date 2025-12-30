/**
 * Drift Detection Service
 * Monitors feature distributions and detects model drift
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, gte, lte, desc, sql, avg, count } from 'drizzle-orm';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('DriftDetector');

// ==================== TYPES ====================

export type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';

export type IServiceResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface IFeatureDistribution {
    featureName: string;
    mean: number;
    std: number;
    min: number;
    max: number;
    sampleCount: number;
}

export interface IBaselineDistribution {
    modelType: MLModelType;
    modelVersion: string;
    features: IFeatureDistribution[];
    createdAt: Date;
}

export interface IDriftScore {
    featureName: string;
    baselineMean: number;
    currentMean: number;
    baselineStd: number;
    currentStd: number;
    psiScore: number; // Population Stability Index
    isDrifted: boolean;
}

export interface IDriftReport {
    modelType: MLModelType;
    modelVersion: string;
    analysisWindow: {
        startDate: Date;
        endDate: Date;
    };
    sampleCount: number;
    overallDriftScore: number;
    isDrifted: boolean;
    featureScores: IDriftScore[];
    recommendations: string[];
}

// PSI thresholds
const PSI_THRESHOLD_LOW = 0.1;  // No significant drift
const PSI_THRESHOLD_HIGH = 0.25; // Significant drift, recommend retraining

// ==================== SERVICE ====================

export class DriftDetectorService {
    private baselines: Map<string, IBaselineDistribution> = new Map();

    constructor(private readonly db: NodePgDatabase<Record<string, unknown>> & { $client: Pool }) { }

    /**
     * Calculate feature distribution from predictions
     */
    async calculateDistribution(
        modelType: MLModelType,
        startDate: Date,
        endDate: Date
    ): Promise<IServiceResult<IFeatureDistribution[]>> {
        try {
            // Get predictions in the window
            const predictions = await this.db
                .select({
                    inputFeatures: mlPredictions.inputFeatures
                })
                .from(mlPredictions)
                .where(
                    and(
                        eq(mlPredictions.modelType, modelType),
                        gte(mlPredictions.createdAt, startDate),
                        lte(mlPredictions.createdAt, endDate)
                    )
                )
                .limit(10000);

            if (predictions.length === 0) {
                return { success: false, error: 'No predictions found in the specified window' };
            }

            // Aggregate features
            const featureStats = new Map<string, number[]>();

            for (const pred of predictions) {
                const features = pred.inputFeatures as Record<string, number>;
                for (const [name, value] of Object.entries(features)) {
                    if (typeof value === 'number') {
                        if (!featureStats.has(name)) {
                            featureStats.set(name, []);
                        }
                        featureStats.get(name)!.push(value);
                    }
                }
            }

            // Calculate statistics
            const distributions: IFeatureDistribution[] = [];

            for (const [featureName, values] of featureStats.entries()) {
                const stats = this.calculateStats(values);
                distributions.push({
                    featureName,
                    ...stats,
                    sampleCount: values.length
                });
            }

            return { success: true, data: distributions };
        } catch (error) {
            logger.error('Failed to calculate distribution', { error });
            return { success: false, error: 'Failed to calculate distribution' };
        }
    }

    /**
     * Set baseline distribution for a model
     */
    setBaseline(
        modelType: MLModelType,
        modelVersion: string,
        features: IFeatureDistribution[]
    ): void {
        const key = `${modelType}:${modelVersion}`;
        this.baselines.set(key, {
            modelType,
            modelVersion,
            features,
            createdAt: new Date()
        });
        logger.info('Baseline set', { modelType, modelVersion, featureCount: features.length });
    }

    /**
     * Get current baseline
     */
    getBaseline(modelType: MLModelType, modelVersion: string): IBaselineDistribution | undefined {
        const key = `${modelType}:${modelVersion}`;
        return this.baselines.get(key);
    }

    /**
     * Detect drift between baseline and current distribution
     */
    async detectDrift(
        modelType: MLModelType,
        modelVersion: string,
        windowDays: number = 7
    ): Promise<IServiceResult<IDriftReport>> {
        try {
            // Get baseline
            const baseline = this.getBaseline(modelType, modelVersion);
            if (!baseline) {
                return { success: false, error: 'No baseline found for this model. Please set a baseline first.' };
            }

            // Calculate current distribution
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - windowDays);

            const currentResult = await this.calculateDistribution(modelType, startDate, endDate);
            if (!currentResult.success) {
                return { success: false, error: currentResult.error };
            }

            const currentDistributions = currentResult.data;
            const currentMap = new Map(currentDistributions.map(d => [d.featureName, d]));

            // Calculate drift scores
            const featureScores: IDriftScore[] = [];
            let totalPsi = 0;
            let featureCount = 0;

            for (const baselineFeature of baseline.features) {
                const current = currentMap.get(baselineFeature.featureName);
                if (!current) continue;

                const psiScore = this.calculatePSI(
                    baselineFeature.mean,
                    baselineFeature.std,
                    current.mean,
                    current.std
                );

                featureScores.push({
                    featureName: baselineFeature.featureName,
                    baselineMean: baselineFeature.mean,
                    currentMean: current.mean,
                    baselineStd: baselineFeature.std,
                    currentStd: current.std,
                    psiScore,
                    isDrifted: psiScore > PSI_THRESHOLD_HIGH
                });

                totalPsi += psiScore;
                featureCount++;
            }

            const overallDriftScore = featureCount > 0 ? totalPsi / featureCount : 0;
            const isDrifted = overallDriftScore > PSI_THRESHOLD_HIGH;
            const driftedFeatures = featureScores.filter(f => f.isDrifted);

            // Generate recommendations
            const recommendations = this.generateRecommendations(
                overallDriftScore,
                driftedFeatures
            );

            const report: IDriftReport = {
                modelType,
                modelVersion,
                analysisWindow: { startDate, endDate },
                sampleCount: currentDistributions[0]?.sampleCount ?? 0,
                overallDriftScore,
                isDrifted,
                featureScores,
                recommendations
            };

            logger.info('Drift detection complete', {
                modelType,
                overallDriftScore,
                isDrifted,
                driftedFeatureCount: driftedFeatures.length
            });

            return { success: true, data: report };
        } catch (error) {
            logger.error('Failed to detect drift', { error });
            return { success: false, error: 'Failed to detect drift' };
        }
    }

    /**
     * Calculate statistics for a set of values
     */
    private calculateStats(values: number[]): { mean: number; std: number; min: number; max: number } {
        if (values.length === 0) {
            return { mean: 0, std: 0, min: 0, max: 0 };
        }

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);

        return { mean, std, min, max };
    }

    /**
     * Calculate Population Stability Index (PSI)
     * Simplified version using mean/std comparison
     */
    private calculatePSI(
        baselineMean: number,
        baselineStd: number,
        currentMean: number,
        currentStd: number
    ): number {
        // Normalized mean shift
        const normalizedShift = baselineStd > 0
            ? Math.abs(currentMean - baselineMean) / baselineStd
            : Math.abs(currentMean - baselineMean);

        // Variance ratio (should be close to 1)
        const varianceRatio = baselineStd > 0 && currentStd > 0
            ? Math.abs(Math.log(currentStd / baselineStd))
            : 0;

        // Combined PSI-like score
        return (normalizedShift * 0.7) + (varianceRatio * 0.3);
    }

    /**
     * Generate recommendations based on drift analysis
     */
    private generateRecommendations(
        overallScore: number,
        driftedFeatures: IDriftScore[]
    ): string[] {
        const recommendations: string[] = [];

        if (overallScore < PSI_THRESHOLD_LOW) {
            recommendations.push('No significant drift detected. Model is performing within expected parameters.');
        } else if (overallScore < PSI_THRESHOLD_HIGH) {
            recommendations.push('Minor drift detected. Consider monitoring more frequently.');
            if (driftedFeatures.length > 0) {
                recommendations.push(`Features with notable changes: ${driftedFeatures.map(f => f.featureName).join(', ')}`);
            }
        } else {
            recommendations.push('⚠️ Significant drift detected. Model retraining recommended.');
            recommendations.push(`${driftedFeatures.length} features have drifted significantly.`);

            // Top drifted features
            const topDrifted = driftedFeatures
                .sort((a, b) => b.psiScore - a.psiScore)
                .slice(0, 3);

            for (const feature of topDrifted) {
                const changePercent = feature.baselineMean !== 0
                    ? ((feature.currentMean - feature.baselineMean) / feature.baselineMean * 100).toFixed(1)
                    : 'N/A';
                recommendations.push(`  - ${feature.featureName}: ${changePercent}% mean change`);
            }
        }

        return recommendations;
    }
}
