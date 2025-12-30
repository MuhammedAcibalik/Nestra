/**
 * Model Calibration Service
 * Calibrates model confidence scores for reliability
 * 
 * Features:
 * - Platt scaling
 * - Isotonic regression
 * - Calibration curve tracking
 * - Reliability diagrams
 */

import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { and, eq, gte, lte, isNotNull, sql } from 'drizzle-orm';
import { createModuleLogger } from '../../../../core/logger';
import { mlPredictions, mlModels } from '../../../../db/schema/ml-analytics';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('ModelCalibration');

// ==================== TYPES ====================

type Database = NodePgDatabase<Record<string, unknown>> & { $client: Pool };

export type CalibrationMethod = 'platt' | 'isotonic' | 'temperature';

export interface ICalibrationParams {
    method: CalibrationMethod;
    // Platt scaling: P(y=1|f) = 1 / (1 + exp(A*f + B))
    plattA?: number;
    plattB?: number;
    // Temperature scaling: softmax(logits / T)
    temperature?: number;
    // Isotonic: piecewise linear mapping
    isotonicBreakpoints?: Array<{ input: number; output: number }>;
}

export interface ICalibrationBin {
    binStart: number;
    binEnd: number;
    meanPredicted: number;
    meanActual: number;
    count: number;
    gap: number; // |meanPredicted - meanActual|
}

export interface ICalibrationMetrics {
    expectedCalibrationError: number;  // ECE
    maximumCalibrationError: number;   // MCE
    brierScore: number;
    reliabilityDiagram: ICalibrationBin[];
    isWellCalibrated: boolean;
    recommendation: string;
}

export interface ICalibrationResult {
    modelId: string;
    modelType: MLModelType;
    method: CalibrationMethod;
    params: ICalibrationParams;
    beforeMetrics: ICalibrationMetrics;
    afterMetrics: ICalibrationMetrics;
    improvement: number;
    calibratedAt: Date;
}

// ==================== SERVICE ====================

export class CalibrationService {
    private calibrations: Map<string, ICalibrationParams> = new Map();

    constructor(
        private readonly db: Database
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Fit calibration on historical predictions
     */
    async fitCalibration(
        modelType: MLModelType,
        method: CalibrationMethod = 'platt',
        days: number = 30
    ): Promise<IServiceResult<ICalibrationResult>> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

            // Get model
            const [model] = await this.db
                .select()
                .from(mlModels)
                .where(and(
                    eq(mlModels.modelType, modelType),
                    eq(mlModels.status, 'production')
                ));

            if (!model) {
                return { success: false, error: 'No production model found' };
            }

            // Fetch predictions with feedback
            const predictions = await this.db
                .select({
                    confidence: mlPredictions.confidence,
                    feedbackScore: mlPredictions.feedbackScore
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, startDate),
                    lte(mlPredictions.createdAt, endDate),
                    isNotNull(mlPredictions.feedbackScore)
                ))
                .limit(10000);

            if (predictions.length < 50) {
                return {
                    success: false,
                    error: `Insufficient labeled data: ${predictions.length} samples`
                };
            }

            const data = predictions
                .filter(p => p.confidence !== null && p.feedbackScore !== null)
                .map(p => ({
                    predicted: p.confidence!,
                    actual: p.feedbackScore! >= 0.5 ? 1 : 0
                }));

            // Calculate before metrics
            const beforeMetrics = this.calculateCalibrationMetrics(data);

            // Fit calibration
            let params: ICalibrationParams;
            switch (method) {
                case 'platt':
                    params = this.fitPlattScaling(data);
                    break;
                case 'temperature':
                    params = this.fitTemperatureScaling(data);
                    break;
                case 'isotonic':
                    params = this.fitIsotonicRegression(data);
                    break;
                default:
                    params = { method };
            }

            // Apply calibration and calculate after metrics
            const calibratedData = data.map(d => ({
                predicted: this.applyCalibration(d.predicted, params),
                actual: d.actual
            }));
            const afterMetrics = this.calculateCalibrationMetrics(calibratedData);

            // Store calibration
            this.calibrations.set(model.id, params);

            const result: ICalibrationResult = {
                modelId: model.id,
                modelType,
                method,
                params,
                beforeMetrics,
                afterMetrics,
                improvement: beforeMetrics.expectedCalibrationError - afterMetrics.expectedCalibrationError,
                calibratedAt: new Date()
            };

            logger.info('Calibration fitted', {
                modelType,
                method,
                eceBefore: beforeMetrics.expectedCalibrationError.toFixed(4),
                eceAfter: afterMetrics.expectedCalibrationError.toFixed(4),
                improvement: result.improvement.toFixed(4)
            });

            return { success: true, data: result };

        } catch (error) {
            logger.error('Calibration failed', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Calibration failed'
            };
        }
    }

    /**
     * Apply calibration to a confidence score
     */
    calibrate(modelId: string, confidence: number): number {
        const params = this.calibrations.get(modelId);
        if (!params) return confidence;
        return this.applyCalibration(confidence, params);
    }

    /**
     * Get calibration metrics for a model
     */
    async getCalibrationMetrics(
        modelType: MLModelType,
        days: number = 14
    ): Promise<IServiceResult<ICalibrationMetrics>> {
        try {
            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

            const predictions = await this.db
                .select({
                    confidence: mlPredictions.confidence,
                    feedbackScore: mlPredictions.feedbackScore
                })
                .from(mlPredictions)
                .where(and(
                    eq(mlPredictions.modelType, modelType),
                    gte(mlPredictions.createdAt, startDate),
                    lte(mlPredictions.createdAt, endDate),
                    isNotNull(mlPredictions.feedbackScore)
                ))
                .limit(5000);

            if (predictions.length < 20) {
                return {
                    success: false,
                    error: 'Insufficient data for calibration metrics'
                };
            }

            const data = predictions
                .filter(p => p.confidence !== null && p.feedbackScore !== null)
                .map(p => ({
                    predicted: p.confidence!,
                    actual: p.feedbackScore! >= 0.5 ? 1 : 0
                }));

            const metrics = this.calculateCalibrationMetrics(data);

            return { success: true, data: metrics };

        } catch (error) {
            logger.error('Failed to get calibration metrics', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed'
            };
        }
    }

    /**
     * Check if model is well-calibrated
     */
    async isWellCalibrated(modelType: MLModelType): Promise<boolean> {
        const result = await this.getCalibrationMetrics(modelType);
        return result.success && result.data?.isWellCalibrated === true;
    }

    // ==================== PRIVATE METHODS ====================

    private fitPlattScaling(
        data: Array<{ predicted: number; actual: number }>
    ): ICalibrationParams {
        // Simplified Platt scaling using gradient descent
        let A = 0;
        let B = 0;
        const lr = 0.1;
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            let gradA = 0;
            let gradB = 0;

            for (const { predicted, actual } of data) {
                const p = 1 / (1 + Math.exp(A * predicted + B));
                const error = p - actual;
                gradA += error * predicted;
                gradB += error;
            }

            A -= lr * gradA / data.length;
            B -= lr * gradB / data.length;
        }

        return { method: 'platt', plattA: A, plattB: B };
    }

    private fitTemperatureScaling(
        data: Array<{ predicted: number; actual: number }>
    ): ICalibrationParams {
        // Find optimal temperature
        let bestT = 1;
        let bestLoss = Infinity;

        for (let T = 0.1; T <= 3; T += 0.1) {
            let loss = 0;
            for (const { predicted, actual } of data) {
                // Convert to logit, scale, convert back
                const logit = Math.log(predicted / (1 - Math.max(0.001, Math.min(0.999, predicted))));
                const scaledLogit = logit / T;
                const calibrated = 1 / (1 + Math.exp(-scaledLogit));
                loss += -(actual * Math.log(calibrated + 0.001) + (1 - actual) * Math.log(1 - calibrated + 0.001));
            }

            if (loss < bestLoss) {
                bestLoss = loss;
                bestT = T;
            }
        }

        return { method: 'temperature', temperature: bestT };
    }

    private fitIsotonicRegression(
        data: Array<{ predicted: number; actual: number }>
    ): ICalibrationParams {
        // Pool Adjacent Violators Algorithm (PAVA)
        const sorted = [...data].sort((a, b) => a.predicted - b.predicted);

        const n = sorted.length;
        const isotonic = new Array(n);
        const weights = new Array(n).fill(1);

        // Initialize with actuals
        for (let i = 0; i < n; i++) {
            isotonic[i] = sorted[i].actual;
        }

        // Pool adjacent violators
        let needsUpdate = true;
        while (needsUpdate) {
            needsUpdate = false;
            for (let i = 0; i < n - 1; i++) {
                if (isotonic[i] > isotonic[i + 1]) {
                    const pooled = (isotonic[i] * weights[i] + isotonic[i + 1] * weights[i + 1]) /
                        (weights[i] + weights[i + 1]);
                    isotonic[i] = pooled;
                    isotonic[i + 1] = pooled;
                    weights[i] = weights[i] + weights[i + 1];
                    weights[i + 1] = weights[i];
                    needsUpdate = true;
                }
            }
        }

        // Create breakpoints (simplified: every 10th point)
        const breakpoints: Array<{ input: number; output: number }> = [];
        for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 10))) {
            breakpoints.push({
                input: sorted[i].predicted,
                output: isotonic[i]
            });
        }

        return { method: 'isotonic', isotonicBreakpoints: breakpoints };
    }

    private applyCalibration(confidence: number, params: ICalibrationParams): number {
        switch (params.method) {
            case 'platt':
                if (params.plattA !== undefined && params.plattB !== undefined) {
                    return 1 / (1 + Math.exp(params.plattA * confidence + params.plattB));
                }
                break;

            case 'temperature':
                if (params.temperature !== undefined) {
                    const safeConf = Math.max(0.001, Math.min(0.999, confidence));
                    const logit = Math.log(safeConf / (1 - safeConf));
                    const scaledLogit = logit / params.temperature;
                    return 1 / (1 + Math.exp(-scaledLogit));
                }
                break;

            case 'isotonic':
                if (params.isotonicBreakpoints && params.isotonicBreakpoints.length > 0) {
                    const bp = params.isotonicBreakpoints;
                    if (confidence <= bp[0].input) return bp[0].output;
                    if (confidence >= bp[bp.length - 1].input) return bp[bp.length - 1].output;

                    for (let i = 0; i < bp.length - 1; i++) {
                        if (confidence >= bp[i].input && confidence <= bp[i + 1].input) {
                            const t = (confidence - bp[i].input) / (bp[i + 1].input - bp[i].input);
                            return bp[i].output + t * (bp[i + 1].output - bp[i].output);
                        }
                    }
                }
                break;
        }

        return confidence;
    }

    private calculateCalibrationMetrics(
        data: Array<{ predicted: number; actual: number }>
    ): ICalibrationMetrics {
        const numBins = 10;
        const bins: ICalibrationBin[] = [];

        for (let i = 0; i < numBins; i++) {
            bins.push({
                binStart: i / numBins,
                binEnd: (i + 1) / numBins,
                meanPredicted: 0,
                meanActual: 0,
                count: 0,
                gap: 0
            });
        }

        // Assign to bins
        for (const { predicted, actual } of data) {
            const binIndex = Math.min(Math.floor(predicted * numBins), numBins - 1);
            bins[binIndex].count++;
            bins[binIndex].meanPredicted += predicted;
            bins[binIndex].meanActual += actual;
        }

        // Calculate means and gaps
        let ece = 0;
        let mce = 0;
        let brierSum = 0;

        for (const bin of bins) {
            if (bin.count > 0) {
                bin.meanPredicted /= bin.count;
                bin.meanActual /= bin.count;
                bin.gap = Math.abs(bin.meanPredicted - bin.meanActual);

                ece += (bin.count / data.length) * bin.gap;
                mce = Math.max(mce, bin.gap);
            }
        }

        // Brier score
        for (const { predicted, actual } of data) {
            brierSum += (predicted - actual) ** 2;
        }
        const brierScore = brierSum / data.length;

        const isWellCalibrated = ece < 0.1;

        let recommendation: string;
        if (isWellCalibrated) {
            recommendation = 'Model is well-calibrated';
        } else if (ece < 0.2) {
            recommendation = 'Consider temperature scaling for minor calibration improvement';
        } else {
            recommendation = 'Significant miscalibration detected - Platt scaling recommended';
        }

        return {
            expectedCalibrationError: ece,
            maximumCalibrationError: mce,
            brierScore,
            reliabilityDiagram: bins,
            isWellCalibrated,
            recommendation
        };
    }
}

// ==================== FACTORY ====================

export function createCalibrationService(db: Database): CalibrationService {
    return new CalibrationService(db);
}
