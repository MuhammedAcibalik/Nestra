/**
 * Drift Detection Service
 * Statistical drift detection using PSI and KS-test
 * 
 * Features:
 * - Population Stability Index (PSI)
 * - Kolmogorov-Smirnov test
 * - Feature distribution tracking
 * - Automatic alert thresholds
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, gte, lte, eq, desc, count, avg } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('DriftDetection');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export type DriftSeverity = 'none' | 'warning' | 'critical';
export type DriftRecommendation = 'monitor' | 'investigate' | 'retrain' | 'urgent';

export interface IFeatureDriftMetrics {
    featureName: string;
    psi: number;              // Population Stability Index
    ksStatistic: number;      // Kolmogorov-Smirnov statistic
    pValue: number;           // KS test p-value
    meanShift: number;        // Shift in mean value
    stdShift: number;         // Shift in standard deviation
    isDrifted: boolean;
}

export interface IDriftReport {
    modelType: MLModelType;
    analysisWindow: {
        baseline: { start: Date; end: Date };
        current: { start: Date; end: Date };
    };
    overallPsi: number;
    overallKs: number;
    severity: DriftSeverity;
    recommendation: DriftRecommendation;
    driftedFeatureCount: number;
    totalFeatureCount: number;
    featureMetrics: IFeatureDriftMetrics[];
    analyzedAt: Date;
    sampleCounts: {
        baseline: number;
        current: number;
    };
}

export interface IDriftConfig {
    /** PSI threshold for warning (default: 0.1) */
    psiWarningThreshold: number;
    /** PSI threshold for critical (default: 0.25) */
    psiCriticalThreshold: number;
    /** KS p-value threshold (default: 0.05) */
    ksPvalueThreshold: number;
    /** Baseline window in days (default: 30) */
    baselineWindowDays: number;
    /** Current window in days (default: 7) */
    currentWindowDays: number;
    /** Minimum samples for analysis (default: 100) */
    minSamples: number;
    /** Number of bins for PSI (default: 10) */
    psiBins: number;
}

const DEFAULT_CONFIG: IDriftConfig = {
    psiWarningThreshold: 0.1,
    psiCriticalThreshold: 0.25,
    ksPvalueThreshold: 0.05,
    baselineWindowDays: 30,
    currentWindowDays: 7,
    minSamples: 100,
    psiBins: 10
};

// ==================== SERVICE ====================

export class DriftDetectionService {
    private readonly config: IDriftConfig;

    constructor(
        private readonly db: Database,
        config?: Partial<IDriftConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== PUBLIC API ====================

    /**
     * Analyze drift for a specific model type
     */
    async analyzeDrift(modelType: MLModelType): Promise<IServiceResult<IDriftReport>> {
        try {
            const now = new Date();
            const currentStart = new Date(now.getTime() - this.config.currentWindowDays * 24 * 60 * 60 * 1000);
            const baselineEnd = new Date(currentStart.getTime() - 1);
            const baselineStart = new Date(baselineEnd.getTime() - this.config.baselineWindowDays * 24 * 60 * 60 * 1000);

            // Fetch feature distributions
            const baselineData = await this.fetchFeatureDistributions(
                modelType,
                baselineStart,
                baselineEnd
            );

            const currentData = await this.fetchFeatureDistributions(
                modelType,
                currentStart,
                now
            );

            if (baselineData.length < this.config.minSamples) {
                return {
                    success: false,
                    error: `Insufficient baseline samples: ${baselineData.length} < ${this.config.minSamples}`
                };
            }

            if (currentData.length < Math.floor(this.config.minSamples / 4)) {
                return {
                    success: false,
                    error: `Insufficient current samples: ${currentData.length}`
                };
            }

            // Get feature names from first record
            const featureNames = baselineData.length > 0
                ? Object.keys(baselineData[0].features)
                : [];

            // Calculate drift metrics for each feature
            const featureMetrics: IFeatureDriftMetrics[] = [];
            let totalPsi = 0;
            let totalKs = 0;
            let driftedCount = 0;

            for (const featureName of featureNames) {
                const baselineValues = baselineData
                    .map(d => d.features[featureName])
                    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

                const currentValues = currentData
                    .map(d => d.features[featureName])
                    .filter((v): v is number => typeof v === 'number' && !isNaN(v));

                if (baselineValues.length < 10 || currentValues.length < 5) {
                    continue;
                }

                const psi = this.calculatePSI(baselineValues, currentValues);
                const { statistic: ksStatistic, pValue } = this.calculateKS(baselineValues, currentValues);
                const meanShift = this.calculateMeanShift(baselineValues, currentValues);
                const stdShift = this.calculateStdShift(baselineValues, currentValues);
                const isDrifted = psi > this.config.psiWarningThreshold || pValue < this.config.ksPvalueThreshold;

                if (isDrifted) driftedCount++;
                totalPsi += psi;
                totalKs += ksStatistic;

                featureMetrics.push({
                    featureName,
                    psi,
                    ksStatistic,
                    pValue,
                    meanShift,
                    stdShift,
                    isDrifted
                });
            }

            // Calculate overall metrics
            const featureCount = featureMetrics.length;
            const overallPsi = featureCount > 0 ? totalPsi / featureCount : 0;
            const overallKs = featureCount > 0 ? totalKs / featureCount : 0;

            // Determine severity and recommendation
            const severity = this.determineSeverity(overallPsi, driftedCount, featureCount);
            const recommendation = this.determineRecommendation(severity, driftedCount, featureCount);

            const report: IDriftReport = {
                modelType,
                analysisWindow: {
                    baseline: { start: baselineStart, end: baselineEnd },
                    current: { start: currentStart, end: now }
                },
                overallPsi,
                overallKs,
                severity,
                recommendation,
                driftedFeatureCount: driftedCount,
                totalFeatureCount: featureCount,
                featureMetrics: featureMetrics.sort((a, b) => b.psi - a.psi),
                analyzedAt: now,
                sampleCounts: {
                    baseline: baselineData.length,
                    current: currentData.length
                }
            };

            logger.info('Drift analysis complete', {
                modelType,
                severity,
                overallPsi: overallPsi.toFixed(4),
                driftedFeatures: driftedCount,
                totalFeatures: featureCount
            });

            return { success: true, data: report };

        } catch (error) {
            logger.error('Drift analysis failed', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Drift analysis failed'
            };
        }
    }

    /**
     * Check all model types for drift
     */
    async checkAllModels(): Promise<IServiceResult<IDriftReport[]>> {
        const modelTypes: MLModelType[] = ['waste_predictor', 'algorithm_selector', 'time_estimator'];
        const reports: IDriftReport[] = [];

        for (const modelType of modelTypes) {
            const result = await this.analyzeDrift(modelType);
            if (result.success && result.data) {
                reports.push(result.data);
            }
        }

        return { success: true, data: reports };
    }

    /**
     * Get drift history for a model
     */
    async getDriftTrend(
        modelType: MLModelType,
        days: number = 30
    ): Promise<IServiceResult<Array<{ date: Date; psi: number; severity: DriftSeverity }>>> {
        // In a real implementation, this would query stored drift metrics
        // For now, we return synthetic trend data
        const trend: Array<{ date: Date; psi: number; severity: DriftSeverity }> = [];

        const now = new Date();
        for (let i = days; i >= 0; i -= 7) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const psi = Math.random() * 0.15; // Simulated
            trend.push({
                date,
                psi,
                severity: this.determineSeverity(psi, 0, 1)
            });
        }

        return { success: true, data: trend };
    }

    // ==================== PRIVATE METHODS ====================

    private async fetchFeatureDistributions(
        modelType: MLModelType,
        startDate: Date,
        endDate: Date
    ): Promise<Array<{ features: Record<string, number> }>> {
        try {
            const predictions = await this.db
                .select({
                    inputFeatures: mlPredictions.inputFeatures
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, startDate),
                    lte(mlPredictions.createdAt, endDate)
                ))
                .orderBy(desc(mlPredictions.createdAt))
                .limit(10000);

            return predictions.map(p => ({
                features: (p.inputFeatures ?? {}) as Record<string, number>
            }));

        } catch (error) {
            logger.error('Failed to fetch feature distributions', { modelType, error });
            return [];
        }
    }

    /**
     * Calculate Population Stability Index
     * PSI = Σ (Actual% - Expected%) * ln(Actual% / Expected%)
     */
    private calculatePSI(baseline: number[], current: number[]): number {
        const bins = this.config.psiBins;

        // Calculate bin edges from baseline
        const min = Math.min(...baseline, ...current);
        const max = Math.max(...baseline, ...current);
        const binWidth = (max - min) / bins;

        if (binWidth === 0) return 0;

        const edges = Array.from({ length: bins + 1 }, (_, i) => min + i * binWidth);

        // Calculate bin proportions
        const baselineCounts = new Array(bins).fill(0);
        const currentCounts = new Array(bins).fill(0);

        for (const value of baseline) {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            baselineCounts[binIndex]++;
        }

        for (const value of current) {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            currentCounts[binIndex]++;
        }

        // Convert to proportions with smoothing
        const epsilon = 0.0001;
        const baselineProps = baselineCounts.map(c => Math.max(c / baseline.length, epsilon));
        const currentProps = currentCounts.map(c => Math.max(c / current.length, epsilon));

        // Calculate PSI
        let psi = 0;
        for (let i = 0; i < bins; i++) {
            const diff = currentProps[i] - baselineProps[i];
            const ratio = currentProps[i] / baselineProps[i];
            psi += diff * Math.log(ratio);
        }

        return Math.abs(psi);
    }

    /**
     * Calculate Kolmogorov-Smirnov test statistic
     */
    private calculateKS(baseline: number[], current: number[]): { statistic: number; pValue: number } {
        // Sort both arrays
        const sortedBaseline = [...baseline].sort((a, b) => a - b);
        const sortedCurrent = [...current].sort((a, b) => a - b);

        // Combine and sort all values
        const allValues = [...new Set([...sortedBaseline, ...sortedCurrent])].sort((a, b) => a - b);

        let maxDiff = 0;
        for (const value of allValues) {
            // Calculate CDF for baseline
            const baselineCdf = sortedBaseline.filter(v => v <= value).length / baseline.length;
            // Calculate CDF for current
            const currentCdf = sortedCurrent.filter(v => v <= value).length / current.length;
            // Track maximum difference
            maxDiff = Math.max(maxDiff, Math.abs(baselineCdf - currentCdf));
        }

        // Approximate p-value using asymptotic formula
        const n = baseline.length * current.length / (baseline.length + current.length);
        const lambda = maxDiff * Math.sqrt(n);

        // Kolmogorov distribution approximation
        const pValue = 2 * Math.exp(-2 * lambda * lambda);

        return {
            statistic: maxDiff,
            pValue: Math.max(0, Math.min(1, pValue))
        };
    }

    private calculateMeanShift(baseline: number[], current: number[]): number {
        const baselineMean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
        const currentMean = current.reduce((a, b) => a + b, 0) / current.length;

        if (baselineMean === 0) return currentMean !== 0 ? 1 : 0;
        return Math.abs((currentMean - baselineMean) / baselineMean);
    }

    private calculateStdShift(baseline: number[], current: number[]): number {
        const calcStd = (arr: number[]): number => {
            const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
            const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
            return Math.sqrt(variance);
        };

        const baselineStd = calcStd(baseline);
        const currentStd = calcStd(current);

        if (baselineStd === 0) return currentStd !== 0 ? 1 : 0;
        return Math.abs((currentStd - baselineStd) / baselineStd);
    }

    private determineSeverity(
        overallPsi: number,
        driftedCount: number,
        totalCount: number
    ): DriftSeverity {
        const driftRatio = totalCount > 0 ? driftedCount / totalCount : 0;

        if (overallPsi >= this.config.psiCriticalThreshold || driftRatio > 0.5) {
            return 'critical';
        }
        if (overallPsi >= this.config.psiWarningThreshold || driftRatio > 0.2) {
            return 'warning';
        }
        return 'none';
    }

    private determineRecommendation(
        severity: DriftSeverity,
        driftedCount: number,
        totalCount: number
    ): DriftRecommendation {
        const driftRatio = totalCount > 0 ? driftedCount / totalCount : 0;

        if (severity === 'critical' || driftRatio > 0.6) {
            return 'urgent';
        }
        if (severity === 'warning' || driftRatio > 0.3) {
            return 'retrain';
        }
        if (driftRatio > 0.1) {
            return 'investigate';
        }
        return 'monitor';
    }
}

// ==================== FACTORY ====================

export function createDriftDetectionService(
    db: Database,
    config?: Partial<IDriftConfig>
): DriftDetectionService {
    return new DriftDetectionService(db, config);
}
