/**
 * Batch Inference Service
 * Process multiple predictions in parallel with concurrency control
 * 
 * Features:
 * - Parallel processing with max concurrency
 * - Progress tracking
 * - Error isolation (one failure doesn't stop batch)
 * - Result aggregation
 */

import { createModuleLogger } from '../../../../core/logger';
import { IServiceResult, MLModelType } from '../../domain';
import { IEnhancedPredictionService } from './enhanced-prediction.service';

const logger = createModuleLogger('BatchInference');

// ==================== TYPES ====================

export interface IBatchItem<TInput = Record<string, unknown>> {
    /** Unique identifier for this item */
    id: string;
    /** Input data for prediction */
    input: TInput;
    /** Optional metadata */
    metadata?: Record<string, unknown>;
}

export interface IBatchPredictionRequest<TInput = Record<string, unknown>> {
    /** Model type to use */
    modelType: MLModelType;
    /** Items to process */
    items: IBatchItem<TInput>[];
    /** Processing options */
    options?: IBatchOptions;
}

export interface IBatchOptions {
    /** Maximum concurrent predictions (default: 5) */
    maxConcurrency?: number;
    /** Timeout per item in ms (default: 10000) */
    itemTimeoutMs?: number;
    /** Stop on first error (default: false) */
    stopOnError?: boolean;
    /** Progress callback */
    onProgress?: (completed: number, total: number) => void;
}

export interface IBatchItemResult<TOutput = unknown> {
    /** Item ID */
    id: string;
    /** Whether prediction succeeded */
    success: boolean;
    /** Prediction result if successful */
    prediction?: TOutput;
    /** Error message if failed */
    error?: string;
    /** Processing time in ms */
    processingTimeMs: number;
}

export interface IBatchPredictionResult<TOutput = unknown> {
    /** Total items processed */
    totalItems: number;
    /** Number of successful predictions */
    successCount: number;
    /** Number of failed predictions */
    failureCount: number;
    /** Individual results */
    results: IBatchItemResult<TOutput>[];
    /** Total batch processing time in ms */
    totalTimeMs: number;
    /** Average processing time per item */
    avgItemTimeMs: number;
    /** Was batch stopped early due to error? */
    stoppedEarly: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<IBatchOptions, 'onProgress'>> = {
    maxConcurrency: 5,
    itemTimeoutMs: 10000,
    stopOnError: false
};

// ==================== SERVICE ====================

export class BatchInferenceService {
    constructor(
        private readonly predictionService: IEnhancedPredictionService
    ) { }

    // ==================== PUBLIC API ====================

    /**
     * Process batch waste predictions
     */
    async predictWasteBatch(
        request: IBatchPredictionRequest
    ): Promise<IServiceResult<IBatchPredictionResult>> {
        const startTime = Date.now();
        const options = { ...DEFAULT_OPTIONS, ...request.options };

        logger.info('Starting batch waste prediction', {
            itemCount: request.items.length,
            maxConcurrency: options.maxConcurrency
        });

        const results: IBatchItemResult[] = [];
        let stoppedEarly = false;

        // Process in chunks based on concurrency
        for (let i = 0; i < request.items.length; i += options.maxConcurrency) {
            if (stoppedEarly) break;

            const chunk = request.items.slice(i, i + options.maxConcurrency);

            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    const itemStart = Date.now();

                    try {
                        // Build job and stock from input
                        const job = this.buildJobFromInput(item.input);
                        const stock = this.buildStockFromInput(item.input);

                        const result = await Promise.race([
                            this.predictionService.predictWaste(job, stock, this.buildParams(item.input)),
                            this.createTimeout(options.itemTimeoutMs)
                        ]);

                        if (!result.success || !result.data) {
                            return {
                                id: item.id,
                                success: false,
                                error: 'error' in result ? result.error : 'Prediction failed',
                                processingTimeMs: Date.now() - itemStart
                            };
                        }

                        return {
                            id: item.id,
                            success: true,
                            prediction: result.data,
                            processingTimeMs: Date.now() - itemStart
                        };

                    } catch (error) {
                        if (options.stopOnError) {
                            stoppedEarly = true;
                        }

                        return {
                            id: item.id,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            processingTimeMs: Date.now() - itemStart
                        };
                    }
                })
            );

            results.push(...chunkResults);

            // Report progress
            if (options.onProgress) {
                options.onProgress(results.length, request.items.length);
            }
        }

        const totalTimeMs = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        const batchResult: IBatchPredictionResult = {
            totalItems: request.items.length,
            successCount,
            failureCount,
            results,
            totalTimeMs,
            avgItemTimeMs: results.length > 0
                ? results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length
                : 0,
            stoppedEarly
        };

        logger.info('Batch prediction complete', {
            totalItems: batchResult.totalItems,
            successCount,
            failureCount,
            totalTimeMs,
            stoppedEarly
        });

        return { success: true, data: batchResult };
    }

    /**
     * Process batch algorithm recommendations
     */
    async recommendAlgorithmBatch(
        request: IBatchPredictionRequest
    ): Promise<IServiceResult<IBatchPredictionResult>> {
        const startTime = Date.now();
        const options = { ...DEFAULT_OPTIONS, ...request.options };

        const results: IBatchItemResult[] = [];
        let stoppedEarly = false;

        for (let i = 0; i < request.items.length; i += options.maxConcurrency) {
            if (stoppedEarly) break;

            const chunk = request.items.slice(i, i + options.maxConcurrency);

            const chunkResults = await Promise.all(
                chunk.map(async (item) => {
                    const itemStart = Date.now();

                    try {
                        const job = this.buildJobFromInput(item.input);
                        const stock = this.buildStockFromInput(item.input);

                        const result = await Promise.race([
                            this.predictionService.recommendAlgorithm(job, stock),
                            this.createTimeout(options.itemTimeoutMs)
                        ]);

                        if (!result.success || !result.data) {
                            return {
                                id: item.id,
                                success: false,
                                error: 'Recommendation failed',
                                processingTimeMs: Date.now() - itemStart
                            };
                        }

                        return {
                            id: item.id,
                            success: true,
                            prediction: result.data,
                            processingTimeMs: Date.now() - itemStart
                        };

                    } catch (error) {
                        if (options.stopOnError) stoppedEarly = true;

                        return {
                            id: item.id,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                            processingTimeMs: Date.now() - itemStart
                        };
                    }
                })
            );

            results.push(...chunkResults);
            if (options.onProgress) options.onProgress(results.length, request.items.length);
        }

        const totalTimeMs = Date.now() - startTime;
        const successCount = results.filter(r => r.success).length;

        return {
            success: true,
            data: {
                totalItems: request.items.length,
                successCount,
                failureCount: results.length - successCount,
                results,
                totalTimeMs,
                avgItemTimeMs: results.length > 0
                    ? results.reduce((sum, r) => sum + r.processingTimeMs, 0) / results.length
                    : 0,
                stoppedEarly
            }
        };
    }

    // ==================== INTERNAL METHODS ====================

    private buildJobFromInput(input: Record<string, unknown>) {
        return {
            id: String(input.jobId ?? 'batch-job'),
            materialTypeId: String(input.materialTypeId ?? 'default'),
            thickness: Number(input.thickness ?? 18),
            items: Array.isArray(input.items) ? input.items : []
        };
    }

    private buildStockFromInput(input: Record<string, unknown>) {
        if (Array.isArray(input.stock)) {
            return input.stock;
        }

        return [{
            id: 'default-stock',
            width: Number(input.stockWidth ?? 2440),
            height: Number(input.stockHeight ?? 1220),
            quantity: Number(input.stockQuantity ?? 10)
        }];
    }

    private buildParams(input: Record<string, unknown>) {
        return {
            kerf: Number(input.kerf ?? 3),
            allowRotation: Boolean(input.allowRotation ?? true)
        };
    }

    private createTimeout<T>(ms: number): Promise<IServiceResult<T>> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        });
    }
}

// ==================== FACTORY ====================

let batchServiceInstance: BatchInferenceService | null = null;

export function getBatchInferenceService(
    predictionService: IEnhancedPredictionService
): BatchInferenceService {
    if (!batchServiceInstance) {
        batchServiceInstance = new BatchInferenceService(predictionService);
    }
    return batchServiceInstance;
}
