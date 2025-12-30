/**
 * Time Estimator Model (ONNX)
 * Predicts production time for cutting plans
 */

import { BaseONNXModel, INormalizationParams } from './base-onnx-model';
import { ITimeEstimationFeatures, ITimePrediction } from '../../domain';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('TimeEstimatorONNX');

// Feature order
const FEATURE_ORDER: (keyof ITimeEstimationFeatures)[] = [
    'totalPieces',
    'totalCuts',
    'wastePercentage',
    'stockUsedCount',
    'machineType',
    'machineSpeed',
    'materialTypeIndex',
    'thickness',
    'averagePieceArea',
    'maxPieceArea',
    'operatorAvgTime',
    'machineAvgTime'
];

export class TimeEstimatorModel extends BaseONNXModel {
    constructor(version: string = '1.0.0') {
        super('time_estimator', version);
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
        // Rule-based time estimation
        const totalPieces = features['totalPieces'] ?? 10;
        const stockUsed = features['stockUsedCount'] ?? 1;
        const thickness = features['thickness'] ?? 5;
        const historicalAvg = features['machineAvgTime'] ?? 60;

        // Base time per piece (minutes)
        const baseTimePerPiece = 0.5;

        // Time calculation
        let estimatedTime = totalPieces * baseTimePerPiece;

        // Adjustments
        estimatedTime += stockUsed * 2; // Setup time per stock
        estimatedTime *= (1 + thickness / 50); // Thickness factor

        // Blend with historical
        estimatedTime = (estimatedTime + historicalAvg) / 2;

        // Normalize (assume 120 min as max)
        return [Math.min(1, estimatedTime / 120)];
    }

    /**
     * Estimate production time
     */
    async estimateTime(features: ITimeEstimationFeatures): Promise<ITimePrediction> {
        const rawPrediction = await this.predict(features as unknown as Record<string, number>);

        // Denormalize (0-1 -> 0-120 minutes)
        const estimatedMinutes = rawPrediction[0] * 120;

        // Confidence interval (±20%)
        const intervalPercent = 0.2;
        const low = estimatedMinutes * (1 - intervalPercent);
        const high = estimatedMinutes * (1 + intervalPercent);

        const factors = this.identifyFactors(features);

        return {
            estimatedMinutes: Math.round(Math.max(5, estimatedMinutes)),
            confidenceInterval: {
                low: Math.round(Math.max(5, low)),
                high: Math.round(high)
            },
            factors,
            modelVersion: this.getMetadata().version,
            predictionId: uuid(),
            timestamp: new Date()
        };
    }

    private identifyFactors(features: ITimeEstimationFeatures): string[] {
        const factors: string[] = [];

        if (features.totalPieces > 50) factors.push('Yüksek parça sayısı');
        if (features.thickness > 10) factors.push('Kalın malzeme');
        if (features.wastePercentage > 20) factors.push('Yüksek fire');
        if (features.stockUsedCount > 5) factors.push('Çoklu stok');

        return factors.length > 0 ? factors : ['Normal operasyon'];
    }
}
