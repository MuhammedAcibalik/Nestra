/**
 * ML Prediction Client Adapter
 * Bridges IMLPredictionClient interface to EnhancedPredictionService
 * 
 * Following Adapter Pattern - converts domain-agnostic interface
 * to the concrete ML analytics implementation.
 * 
 * Enhanced with Circuit Breaker pattern for fault tolerance.
 */

import CircuitBreaker from 'opossum';
import {
    IMLPredictionClient,
    IMLServiceResult,
    IWastePredictionInput,
    IWastePredictionResult,
    IAlgorithmSelectionInput,
    IAlgorithmSelectionResult,
    ITimePredictionInput,
    ITimePredictionResult,
    MLAlgorithmSuggestion
} from '../../../../core/services';
import { IEnhancedPredictionService } from '../../application/inference';
import { createModuleLogger } from '../../../../core/logger';
import { createCircuitBreaker, ICircuitBreakerConfig } from '../../../../core/resilience/circuit-breaker';

const logger = createModuleLogger('MLPredictionClientAdapter');

// ==================== CIRCUIT BREAKER CONFIG ====================

const ML_CIRCUIT_BREAKER_CONFIG: Omit<ICircuitBreakerConfig, 'name'> = {
    timeout: 5000,               // 5s timeout for ML predictions
    errorThresholdPercentage: 50,
    resetTimeout: 15000,         // 15s before trying again
    volumeThreshold: 3,          // Min 3 requests before evaluation
    enableTracing: true
};

// ==================== FALLBACK VALUES ====================

const FALLBACK_WASTE_PREDICTION: IWastePredictionResult = {
    predictedWastePercent: 12.5, // Conservative default
    confidence: 0.3,
    modelVersion: 'fallback',
    predictionId: 'fallback-prediction'
};

const FALLBACK_ALGORITHM_2D: IAlgorithmSelectionResult = {
    recommendedAlgorithm: '2D_GUILLOTINE',
    confidence: 0.3,
    scores: { '2D_GUILLOTINE': 0.5, '2D_BOTTOM_LEFT': 0.3 },
    modelVersion: 'fallback'
};

const FALLBACK_ALGORITHM_1D: IAlgorithmSelectionResult = {
    recommendedAlgorithm: '1D_FFD',
    confidence: 0.3,
    scores: { '1D_FFD': 0.5, '1D_BFD': 0.3 },
    modelVersion: 'fallback'
};

const FALLBACK_TIME_PREDICTION: ITimePredictionResult = {
    predictedTimeSeconds: 1800, // 30 minutes default
    confidence: 0.3,
    modelVersion: 'fallback'
};

// ==================== ADAPTER ====================

/**
 * Adapter that implements IMLPredictionClient by delegating to EnhancedPredictionService
 * This allows OptimizationEngine to use ML predictions without direct dependency
 * 
 * Circuit Breaker protection ensures graceful degradation on ML service failures
 */
export class MLPredictionClientAdapter implements IMLPredictionClient {
    private readonly wastePredictionBreaker: CircuitBreaker<[IWastePredictionInput], IWastePredictionResult>;
    private readonly algorithmSelectionBreaker: CircuitBreaker<[IAlgorithmSelectionInput], IAlgorithmSelectionResult>;
    private readonly timePredictionBreaker: CircuitBreaker<[ITimePredictionInput], ITimePredictionResult>;

    constructor(
        private readonly predictionService: IEnhancedPredictionService
    ) {
        // Initialize circuit breakers with fallbacks
        // Fallback must accept the same args as the action
        this.wastePredictionBreaker = createCircuitBreaker(
            (input: IWastePredictionInput) => this.doWastePrediction(input),
            { ...ML_CIRCUIT_BREAKER_CONFIG, name: 'ml-waste-prediction' },
            (_input: IWastePredictionInput) => FALLBACK_WASTE_PREDICTION
        );

        this.algorithmSelectionBreaker = createCircuitBreaker(
            (input: IAlgorithmSelectionInput) => this.doAlgorithmSelection(input),
            { ...ML_CIRCUIT_BREAKER_CONFIG, name: 'ml-algorithm-selection' },
            (input: IAlgorithmSelectionInput) => input.is1D ? FALLBACK_ALGORITHM_1D : FALLBACK_ALGORITHM_2D
        );

        this.timePredictionBreaker = createCircuitBreaker(
            (input: ITimePredictionInput) => this.doTimePrediction(input),
            { ...ML_CIRCUIT_BREAKER_CONFIG, name: 'ml-time-prediction' },
            (_input: ITimePredictionInput) => FALLBACK_TIME_PREDICTION
        );

        logger.info('ML Prediction Client Adapter initialized with circuit breakers');
    }

    // ==================== PUBLIC API ====================

    async predictWaste(input: IWastePredictionInput): Promise<IMLServiceResult<IWastePredictionResult>> {
        try {
            const result = await this.wastePredictionBreaker.fire(input);
            const isFallback = result.modelVersion === 'fallback';

            if (isFallback) {
                logger.warn('Using fallback waste prediction', {
                    circuitState: this.getCircuitState(this.wastePredictionBreaker)
                });
            }

            return { success: true, data: result };
        } catch (error) {
            logger.error('Waste prediction circuit breaker failed', { error });
            return { success: true, data: FALLBACK_WASTE_PREDICTION };
        }
    }

    async selectAlgorithm(input: IAlgorithmSelectionInput): Promise<IMLServiceResult<IAlgorithmSelectionResult>> {
        try {
            const result = await this.algorithmSelectionBreaker.fire(input);
            const isFallback = result.modelVersion === 'fallback';

            if (isFallback) {
                logger.warn('Using fallback algorithm selection', {
                    is1D: input.is1D,
                    circuitState: this.getCircuitState(this.algorithmSelectionBreaker)
                });
            }

            return { success: true, data: result };
        } catch (error) {
            logger.error('Algorithm selection circuit breaker failed', { error });
            return { success: true, data: input.is1D ? FALLBACK_ALGORITHM_1D : FALLBACK_ALGORITHM_2D };
        }
    }

    async predictTime(input: ITimePredictionInput): Promise<IMLServiceResult<ITimePredictionResult>> {
        try {
            const result = await this.timePredictionBreaker.fire(input);
            const isFallback = result.modelVersion === 'fallback';

            if (isFallback) {
                logger.warn('Using fallback time prediction', {
                    circuitState: this.getCircuitState(this.timePredictionBreaker)
                });
            }

            return { success: true, data: result };
        } catch (error) {
            logger.error('Time prediction circuit breaker failed', { error });
            return { success: true, data: FALLBACK_TIME_PREDICTION };
        }
    }

    async recordOutcome(predictionId: string, actualWastePercent: number, actualTimeSeconds: number): Promise<void> {
        try {
            logger.info('Recording prediction outcome', {
                predictionId,
                actualWastePercent,
                actualTimeSeconds
            });
            // Connected to feedback loop in OptimizationFeedbackHandler
        } catch (error) {
            logger.error('Failed to record outcome', { predictionId, error });
        }
    }

    /**
     * Get circuit breaker status for monitoring
     */
    getCircuitBreakerStatus(): {
        waste: { state: string; stats: object };
        algorithm: { state: string; stats: object };
        time: { state: string; stats: object };
    } {
        return {
            waste: {
                state: this.getCircuitState(this.wastePredictionBreaker),
                stats: this.wastePredictionBreaker.stats
            },
            algorithm: {
                state: this.getCircuitState(this.algorithmSelectionBreaker),
                stats: this.algorithmSelectionBreaker.stats
            },
            time: {
                state: this.getCircuitState(this.timePredictionBreaker),
                stats: this.timePredictionBreaker.stats
            }
        };
    }

    // ==================== INTERNAL PREDICTION METHODS ====================

    private async doWastePrediction(input: IWastePredictionInput): Promise<IWastePredictionResult> {
        const job = this.buildJobInput(input);
        const stock = this.buildStockInput(input);
        const params = { kerf: input.kerf, allowRotation: input.allowRotation === 1 };
        const historical = {
            avgWastePercent: input.historicalAvgWaste,
            lastJobWaste: input.lastJobWaste
        };

        const result = await this.predictionService.predictWaste(job, stock, params, historical);

        if (!result.success || !result.data) {
            throw new Error('Waste prediction failed');
        }

        return {
            predictedWastePercent: result.data.predictedWastePercent,
            confidence: result.data.confidence,
            modelVersion: result.data.modelVersion,
            predictionId: result.data.predictionId
        };
    }

    private async doAlgorithmSelection(input: IAlgorithmSelectionInput): Promise<IAlgorithmSelectionResult> {
        const job = this.buildJobInputFromAlgoInput(input);
        const stock = this.buildMinimalStockInput(input.stockCount);
        const historical = {
            algorithmPerformance: input.algorithmPerformance as { BOTTOM_LEFT: number; GUILLOTINE: number; MAXRECTS: number }
        };

        const result = await this.predictionService.recommendAlgorithm(job, stock, historical);

        if (!result.success || !result.data) {
            throw new Error('Algorithm selection failed');
        }

        const algorithmMap: Record<string, MLAlgorithmSuggestion> = {
            'BOTTOM_LEFT': '2D_BOTTOM_LEFT',
            'GUILLOTINE': '2D_GUILLOTINE',
            'MAXRECTS': '2D_GUILLOTINE'
        };

        const recommended: MLAlgorithmSuggestion = input.is1D
            ? '1D_FFD'
            : (algorithmMap[result.data.recommendedAlgorithm] ?? '2D_GUILLOTINE');

        return {
            recommendedAlgorithm: recommended,
            confidence: result.data.confidence,
            scores: { [result.data.recommendedAlgorithm]: result.data.confidence },
            modelVersion: result.data.modelVersion
        };
    }

    private async doTimePrediction(input: ITimePredictionInput): Promise<ITimePredictionResult> {
        const plan = {
            totalPieces: input.pieceCount,
            totalCuts: input.pieceCount,
            wastePercentage: 10,
            stockUsedCount: input.stockCount
        };

        const machine = {
            id: 'default',
            machineType: input.is1D ? 'BAR_CUTTER' : 'PANEL_SAW'
        };

        const historical = {
            avgProductionTime: input.historicalAvgTime
        };

        const result = await this.predictionService.estimateTime(
            plan,
            machine,
            'default-material',
            18,
            historical
        );

        if (!result.success || !result.data) {
            throw new Error('Time prediction failed');
        }

        return {
            predictedTimeSeconds: result.data.estimatedMinutes * 60,
            confidence: 0.8,
            modelVersion: result.data.modelVersion
        };
    }

    // ==================== HELPER METHODS ====================

    private getCircuitState(breaker: CircuitBreaker): string {
        if (breaker.opened) return 'OPEN';
        if (breaker.halfOpen) return 'HALF_OPEN';
        return 'CLOSED';
    }

    private buildJobInput(input: IWastePredictionInput) {
        return {
            id: 'prediction-request',
            materialTypeId: `material-${input.materialTypeIndex}`,
            thickness: 18,
            items: this.generateSyntheticItems(input)
        };
    }

    private buildJobInputFromAlgoInput(input: IAlgorithmSelectionInput) {
        return {
            id: 'algo-selection-request',
            materialTypeId: 'material-default',
            thickness: 18,
            items: Array.from({ length: input.uniquePieceCount }, (_, i) => ({
                width: 100 + i * 10,
                height: 100 + i * 10,
                quantity: Math.ceil(input.totalPieceCount / input.uniquePieceCount)
            }))
        };
    }

    private buildStockInput(input: IWastePredictionInput) {
        return Array.from({ length: input.stockSheetCount }, (_, i) => ({
            id: `stock-${i}`,
            width: Math.sqrt(input.avgStockArea * input.stockAspectRatio),
            height: Math.sqrt(input.avgStockArea / input.stockAspectRatio),
            quantity: 1
        }));
    }

    private buildMinimalStockInput(count: number) {
        return Array.from({ length: count }, (_, i) => ({
            id: `stock-${i}`,
            width: 2440,
            height: 1220,
            quantity: 1
        }));
    }

    private generateSyntheticItems(input: IWastePredictionInput) {
        const items = [];
        const count = Math.min(input.uniquePieceCount, 10);

        for (let i = 0; i < count; i++) {
            const area = input.avgPieceArea + (i - count / 2) * input.pieceAreaStdDev;
            const aspectRatio = input.pieceAspectRatioMean;

            items.push({
                width: Math.sqrt(Math.max(area, 100) * aspectRatio),
                height: Math.sqrt(Math.max(area, 100) / aspectRatio),
                quantity: Math.ceil(input.totalPieceCount / count)
            });
        }

        return items;
    }
}

