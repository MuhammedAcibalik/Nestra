/**
 * Ensemble Service
 * Multi-model ensemble for improved prediction accuracy
 * 
 * Features:
 * - Weighted voting/averaging
 * - Dynamic weight adjustment based on recent accuracy
 * - Fallback chain when models fail
 * - Disagreement detection
 */

import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, MLModelType } from '../../domain';
import { BaseONNXModel } from '../../infrastructure/models/base-onnx-model';

const logger = createModuleLogger('EnsembleService');

// ==================== TYPES ====================

export interface IModelWeight {
    modelId: string;
    weight: number;
    recentAccuracy?: number;
    predictionCount: number;
}

export interface IEnsembleConfig {
    /** Minimum models required for ensemble */
    minModels: number;
    /** How to combine predictions */
    strategy: 'weighted_average' | 'majority_vote' | 'median';
    /** Auto-adjust weights based on accuracy */
    autoAdjustWeights: boolean;
    /** Threshold for disagreement warning */
    disagreementThreshold: number;
    /** Fallback to single model on failure */
    enableFallback: boolean;
}

export interface IEnsemblePrediction<T> {
    /** Combined prediction result */
    result: T;
    /** Individual model predictions */
    modelPredictions: Array<{
        modelId: string;
        prediction: T;
        weight: number;
        latencyMs: number;
    }>;
    /** Confidence based on agreement */
    confidence: number;
    /** Whether models disagreed significantly */
    hasDisagreement: boolean;
    /** Total ensemble prediction time */
    totalLatencyMs: number;
}

const DEFAULT_CONFIG: IEnsembleConfig = {
    minModels: 2,
    strategy: 'weighted_average',
    autoAdjustWeights: true,
    disagreementThreshold: 0.2, // 20% relative difference
    enableFallback: true
};

// ==================== SERVICE ====================

export class EnsembleService {
    private readonly config: IEnsembleConfig;
    private weights: Map<string, IModelWeight> = new Map();

    constructor(config?: Partial<IEnsembleConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ==================== PUBLIC API ====================

    /**
     * Run ensemble prediction across multiple models
     */
    async predict<T extends number | Record<string, unknown>>(
        modelType: MLModelType,
        models: BaseONNXModel[],
        predictFn: (model: BaseONNXModel) => Promise<T>,
        extractValue: (result: T) => number = (r) => typeof r === 'number' ? r : 0
    ): Promise<IServiceResult<IEnsemblePrediction<T>>> {
        const startTime = Date.now();

        if (models.length < this.config.minModels) {
            if (!this.config.enableFallback || models.length === 0) {
                return {
                    success: false,
                    error: `Insufficient models: ${models.length}/${this.config.minModels} required`
                };
            }
            logger.warn('Running with fewer models than recommended', {
                available: models.length,
                recommended: this.config.minModels
            });
        }

        const modelPredictions: Array<{
            modelId: string;
            prediction: T;
            weight: number;
            latencyMs: number;
        }> = [];

        // Run predictions in parallel
        const results = await Promise.allSettled(
            models.map(async (model) => {
                const modelStart = Date.now();
                const modelId = model.getMetadata().version;
                const prediction = await predictFn(model);
                const latencyMs = Date.now() - modelStart;

                return {
                    modelId,
                    prediction,
                    weight: this.getWeight(modelId),
                    latencyMs
                };
            })
        );

        // Collect successful predictions
        for (const result of results) {
            if (result.status === 'fulfilled') {
                modelPredictions.push(result.value);
            } else {
                logger.warn('Model prediction failed in ensemble', { error: result.reason });
            }
        }

        if (modelPredictions.length === 0) {
            return { success: false, error: 'All model predictions failed' };
        }

        // Calculate combined result
        const values = modelPredictions.map(p => ({
            value: extractValue(p.prediction),
            weight: p.weight
        }));

        const combinedValue = this.combineValues(values);
        const hasDisagreement = this.checkDisagreement(values.map(v => v.value));
        const confidence = this.calculateConfidence(values.map(v => v.value));

        // Build result - use the first prediction as template, update value
        const combinedResult = this.buildCombinedResult(
            modelPredictions[0].prediction,
            combinedValue
        );

        const ensembleResult: IEnsemblePrediction<T> = {
            result: combinedResult,
            modelPredictions,
            confidence,
            hasDisagreement,
            totalLatencyMs: Date.now() - startTime
        };

        logger.info('Ensemble prediction complete', {
            modelType,
            modelsUsed: modelPredictions.length,
            confidence,
            hasDisagreement,
            latencyMs: ensembleResult.totalLatencyMs
        });

        return { success: true, data: ensembleResult };
    }

    /**
     * Update model weight based on actual outcome
     */
    updateWeight(modelId: string, wasAccurate: boolean): void {
        if (!this.config.autoAdjustWeights) return;

        const current = this.weights.get(modelId) ?? {
            modelId,
            weight: 1.0,
            predictionCount: 0
        };

        // Exponential moving average for accuracy
        const alpha = 0.1;
        const accuracyDelta = wasAccurate ? 1 : 0;
        const newAccuracy = current.recentAccuracy !== undefined
            ? current.recentAccuracy * (1 - alpha) + accuracyDelta * alpha
            : accuracyDelta;

        // Weight based on accuracy (0.5 to 1.5 range)
        const newWeight = 0.5 + newAccuracy;

        this.weights.set(modelId, {
            modelId,
            weight: newWeight,
            recentAccuracy: newAccuracy,
            predictionCount: current.predictionCount + 1
        });
    }

    /**
     * Get all current weights
     */
    getWeights(): IModelWeight[] {
        return Array.from(this.weights.values());
    }

    /**
     * Reset all weights
     */
    resetWeights(): void {
        this.weights.clear();
    }

    // ==================== INTERNAL METHODS ====================

    private getWeight(modelId: string): number {
        return this.weights.get(modelId)?.weight ?? 1.0;
    }

    private combineValues(values: Array<{ value: number; weight: number }>): number {
        switch (this.config.strategy) {
            case 'weighted_average':
                const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
                return values.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight;

            case 'median':
                const sorted = [...values].sort((a, b) => a.value - b.value);
                const mid = Math.floor(sorted.length / 2);
                return sorted.length % 2 === 0
                    ? (sorted[mid - 1].value + sorted[mid].value) / 2
                    : sorted[mid].value;

            case 'majority_vote':
                // For classification - find most common value (binned)
                const bins = new Map<number, number>();
                for (const v of values) {
                    const binned = Math.round(v.value * 10) / 10;
                    bins.set(binned, (bins.get(binned) ?? 0) + v.weight);
                }
                let maxWeight = 0;
                let maxValue = 0;
                for (const [val, weight] of bins) {
                    if (weight > maxWeight) {
                        maxWeight = weight;
                        maxValue = val;
                    }
                }
                return maxValue;

            default:
                return values[0]?.value ?? 0;
        }
    }

    private checkDisagreement(values: number[]): boolean {
        if (values.length < 2) return false;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        if (mean === 0) return false;

        const maxDiff = Math.max(...values.map(v => Math.abs(v - mean) / Math.abs(mean)));
        return maxDiff > this.config.disagreementThreshold;
    }

    private calculateConfidence(values: number[]): number {
        if (values.length < 2) return 0.5;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        if (mean === 0) return 0.9;

        // Coefficient of variation (lower = more agreement = higher confidence)
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / Math.abs(mean);

        // Map CV to confidence (0-1)
        return Math.max(0.1, Math.min(1.0, 1 - cv * 2));
    }

    private buildCombinedResult<T>(template: T, combinedValue: number): T {
        if (typeof template === 'number') {
            return combinedValue as T;
        }

        if (typeof template === 'object' && template !== null) {
            // For objects, find the main numeric field and update it
            const result = { ...template };

            // Common field names for predictions
            const numericFields = [
                'predictedWastePercent',
                'wastePercent',
                'estimatedMinutes',
                'estimatedTime',
                'prediction',
                'score'
            ];

            for (const field of numericFields) {
                if (field in result) {
                    (result as Record<string, unknown>)[field] = combinedValue;
                    break;
                }
            }

            return result;
        }

        return template;
    }
}

// ==================== FACTORY ====================

let ensembleServiceInstance: EnsembleService | null = null;

export function getEnsembleService(config?: Partial<IEnsembleConfig>): EnsembleService {
    if (!ensembleServiceInstance) {
        ensembleServiceInstance = new EnsembleService(config);
    }
    return ensembleServiceInstance;
}
