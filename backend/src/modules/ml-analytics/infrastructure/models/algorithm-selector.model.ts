/**
 * Algorithm Selector Model (ONNX)
 * Recommends the best cutting algorithm
 */

import { BaseONNXModel, INormalizationParams } from './base-onnx-model';
import { IAlgorithmSelectionFeatures, IAlgorithmPrediction, AlgorithmType } from '../../domain';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('AlgorithmSelectorONNX');

// Feature order
const FEATURE_ORDER: (keyof IAlgorithmSelectionFeatures)[] = [
    'pieceSizeVariance',
    'smallPieceRatio',
    'largePieceRatio',
    'squarePieceRatio',
    'uniqueShapeCount',
    'rotationAllowed',
    'grainConstraintRatio',
    'stockVariety',
    'standardSizeRatio',
    'bottomLeftHistoricalWaste',
    'guillotineHistoricalWaste',
    'maxrectsHistoricalWaste',
    'totalPieceCount',
    'totalStockCount'
];

const ALGORITHMS: AlgorithmType[] = ['BOTTOM_LEFT', 'GUILLOTINE', 'MAXRECTS'];

export class AlgorithmSelectorModel extends BaseONNXModel {
    constructor(version: string = '1.0.0') {
        super('algorithm_selector', version);
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
        // Rule-based algorithm selection
        const grainRatio = features['grainConstraintRatio'] ?? 0;
        const smallRatio = features['smallPieceRatio'] ?? 0;
        const variance = features['pieceSizeVariance'] ?? 0;

        // Historical performance
        const blWaste = features['bottomLeftHistoricalWaste'] ?? 15;
        const guillotineWaste = features['guillotineHistoricalWaste'] ?? 15;
        const maxrectsWaste = features['maxrectsHistoricalWaste'] ?? 15;

        // Decision logic
        let probs = [0.33, 0.33, 0.34]; // Default equal

        if (grainRatio > 0.3) {
            // Grain constraints favor guillotine
            probs = [0.2, 0.6, 0.2];
        } else if (smallRatio > 0.5) {
            // Many small pieces favor bottom-left
            probs = [0.5, 0.25, 0.25];
        } else if (variance > 0.5) {
            // High variance favors maxrects
            probs = [0.2, 0.2, 0.6];
        } else {
            // Use historical performance
            const minWaste = Math.min(blWaste, guillotineWaste, maxrectsWaste);
            if (minWaste === blWaste) probs = [0.6, 0.2, 0.2];
            else if (minWaste === guillotineWaste) probs = [0.2, 0.6, 0.2];
            else probs = [0.2, 0.2, 0.6];
        }

        return probs;
    }

    /**
     * Recommend algorithm with probabilities
     */
    async recommendAlgorithm(features: IAlgorithmSelectionFeatures): Promise<IAlgorithmPrediction> {
        const probabilities = await this.predict(features as unknown as Record<string, number>);

        // Softmax if needed
        const softmax = this.softmax(probabilities);

        // Find best algorithm
        const maxIdx = softmax.indexOf(Math.max(...softmax));
        const recommendedAlgorithm = ALGORITHMS[maxIdx];
        const confidence = softmax[maxIdx];

        // Build reasoning
        const reasoning = this.buildReasoning(features, recommendedAlgorithm);

        return {
            recommendedAlgorithm,
            probabilities: {
                BOTTOM_LEFT: Math.round(softmax[0] * 1000) / 1000,
                GUILLOTINE: Math.round(softmax[1] * 1000) / 1000,
                MAXRECTS: Math.round(softmax[2] * 1000) / 1000
            },
            confidence: Math.round(confidence * 100) / 100,
            reasoning,
            modelVersion: this.getMetadata().version,
            predictionId: uuid(),
            timestamp: new Date()
        };
    }

    private softmax(arr: number[]): number[] {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(x => x / sum);
    }

    private buildReasoning(features: IAlgorithmSelectionFeatures, algorithm: AlgorithmType): string {
        const reasons: string[] = [];

        switch (algorithm) {
            case 'BOTTOM_LEFT':
                if (features.smallPieceRatio > 0.5) reasons.push('Çok sayıda küçük parça');
                if (features.rotationAllowed === 1) reasons.push('Rotasyon esnekliği');
                break;
            case 'GUILLOTINE':
                if (features.grainConstraintRatio > 0.3) reasons.push('Desen yönü kısıtlamaları');
                if (features.largePieceRatio > 0.4) reasons.push('Büyük parçalar');
                break;
            case 'MAXRECTS':
                if (features.pieceSizeVariance > 0.5) reasons.push('Değişken parça boyutları');
                if (features.uniqueShapeCount > 10) reasons.push('Çeşitli şekiller');
                break;
        }

        return reasons.length > 0 ? reasons.join('. ') : 'Geçmiş performansa göre önerildi';
    }
}
