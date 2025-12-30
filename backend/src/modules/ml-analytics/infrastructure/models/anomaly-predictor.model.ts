/**
 * Anomaly Predictor Model (ONNX)
 * Predicts potential issues before they occur
 */

import { BaseONNXModel, INormalizationParams } from './base-onnx-model';
import { IAnomalyPredictionFeatures, IAnomalyPrediction } from '../../domain';
import { createModuleLogger } from '../../../../core/logger';
import { v4 as uuid } from 'uuid';

const logger = createModuleLogger('AnomalyPredictorONNX');

// Feature order
const FEATURE_ORDER: (keyof IAnomalyPredictionFeatures)[] = [
    'currentWaste',
    'currentTime',
    'currentEfficiency',
    'wasteDeviation',
    'timeDeviation',
    'efficiencyDeviation',
    'recentAnomalyCount',
    'avgHistoricalWaste',
    'avgHistoricalTime',
    'dayOfWeek',
    'hourOfDay',
    'isWeekend'
];

const ANOMALY_TYPES = ['high_waste', 'slow_production', 'machine_issue', 'quality_problem'];

export class AnomalyPredictorModel extends BaseONNXModel {
    private readonly riskThreshold = 0.6;

    constructor(version: string = '1.0.0') {
        super('anomaly_predictor', version);
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
        // Rule-based anomaly prediction
        let riskScore = 0;
        const anomalyProbs = [0, 0, 0, 0];

        const wasteDeviation = features['wasteDeviation'] ?? 0;
        const timeDeviation = features['timeDeviation'] ?? 0;
        const efficiencyDeviation = features['efficiencyDeviation'] ?? 0;
        const recentAnomalies = features['recentAnomalyCount'] ?? 0;

        // High waste
        if (wasteDeviation > 2) {
            anomalyProbs[0] = 0.8;
            riskScore += 0.3;
        }

        // Slow production
        if (timeDeviation > 1.5) {
            anomalyProbs[1] = 0.7;
            riskScore += 0.25;
        }

        // Machine issue
        if (efficiencyDeviation < -1.5) {
            anomalyProbs[2] = 0.6;
            riskScore += 0.2;
        }

        // Quality based on recent anomalies
        if (recentAnomalies > 3) {
            anomalyProbs[3] = 0.5;
            riskScore += 0.15;
        }

        return [Math.min(1, riskScore), ...anomalyProbs];
    }

    /**
     * Predict potential anomalies
     */
    async predictAnomalies(features: IAnomalyPredictionFeatures): Promise<IAnomalyPrediction> {
        const predictions = await this.predict(features as unknown as Record<string, number>);

        const riskScore = predictions[0];
        const anomalyProbabilities = predictions.slice(1);

        const predictedAnomalies = ANOMALY_TYPES
            .map((type, i) => ({
                type,
                probability: Math.round((anomalyProbabilities[i] ?? 0) * 100) / 100
            }))
            .filter(a => a.probability > 0.3)
            .sort((a, b) => b.probability - a.probability);

        return {
            riskScore: Math.round(riskScore * 100) / 100,
            predictedAnomalies,
            isHighRisk: riskScore > this.riskThreshold,
            modelVersion: this.getMetadata().version,
            predictionId: uuid(),
            timestamp: new Date()
        };
    }
}
