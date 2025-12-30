/**
 * Waste Predictor Model (ONNX)
 * Predicts expected waste percentage before optimization
 */

import { BaseONNXModel, INormalizationParams } from './base-onnx-model';
import { IWastePredictionFeatures, IWastePrediction } from '../../domain';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('WastePredictorONNX');

// Feature order for consistent input
const FEATURE_ORDER: (keyof IWastePredictionFeatures)[] = [
    'totalPieceCount',
    'uniquePieceCount',
    'avgPieceArea',
    'pieceAreaStdDev',
    'minPieceArea',
    'maxPieceArea',
    'pieceAspectRatioMean',
    'pieceAspectRatioStdDev',
    'totalStockArea',
    'stockSheetCount',
    'avgStockArea',
    'stockAspectRatio',
    'totalDemandToStockRatio',
    'pieceToStockSizeRatio',
    'kerf',
    'allowRotation',
    'materialTypeIndex',
    'historicalAvgWaste',
    'lastJobWaste'
];

export class WastePredictorModel extends BaseONNXModel {
    constructor(version: string = '1.0.0') {
        super('waste_predictor', version);
    }

    getFeatureOrder(): string[] {
        return [...FEATURE_ORDER];
    }

    protected getDefaultNormParams(): INormalizationParams {
        return {
            means: new Array(FEATURE_ORDER.length).fill(0),
            stds: new Array(FEATURE_ORDER.length).fill(1)
        };
    }

    protected getFallbackPrediction(features: Record<string, number>): number[] {
        // Rule-based fallback
        const historicalWaste = features['historicalAvgWaste'] ?? 15;
        const demandRatio = features['totalDemandToStockRatio'] ?? 0.7;

        // Estimate waste based on demand ratio
        let estimatedWaste = historicalWaste;
        if (demandRatio > 0.9) {
            estimatedWaste = historicalWaste * 0.8; // High utilization
        } else if (demandRatio < 0.5) {
            estimatedWaste = historicalWaste * 1.2; // Low utilization
        }

        // Return normalized (0-1 for sigmoid output)
        return [Math.min(1, estimatedWaste / 100)];
    }

    /**
     * Make waste prediction with confidence
     */
    async predictWaste(features: IWastePredictionFeatures): Promise<IWastePrediction> {
        const rawPrediction = await this.predict(features as unknown as Record<string, number>);

        // Output is sigmoid (0-1), scale to 0-100%
        const predictedWastePercent = rawPrediction[0] * 100;

        // Confidence based on model status
        const confidence = this.isReady() ? 0.85 : 0.5;

        return {
            predictedWastePercent: Math.round(predictedWastePercent * 100) / 100,
            confidence: Math.round(confidence * 100) / 100,
            modelVersion: this.getMetadata().version,
            predictionId: uuid(),
            timestamp: new Date()
        };
    }
}
