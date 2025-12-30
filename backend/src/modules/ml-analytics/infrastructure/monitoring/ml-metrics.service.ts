/**
 * ML Metrics Service
 * Helper functions for recording ML prediction metrics
 * Following Microservice Pattern: Observability, Metrics
 */

import {
    mlPredictionsTotal,
    mlPredictionLatency,
    mlModelHealthGauge,
    mlExperimentAssignmentsTotal
} from '../../../../core/monitoring/metrics';
import { createModuleLogger } from '../../../../core/logger';

const logger = createModuleLogger('MLMetrics');

// ==================== TYPES ====================

export type MLModelType = 'waste_predictor' | 'time_estimator' | 'algorithm_selector' | 'anomaly_predictor';
export type VariantType = 'control' | 'variant';
export type PredictionStatus = 'success' | 'failure' | 'fallback';

// ==================== HELPER FUNCTIONS ====================

/**
 * Record a prediction with its latency and outcome
 */
export function recordPrediction(
    modelType: MLModelType,
    variant: VariantType,
    status: PredictionStatus,
    latencyMs: number
): void {
    try {
        mlPredictionsTotal.labels(modelType, variant, status).inc();
        mlPredictionLatency.labels(modelType).observe(latencyMs / 1000); // Convert to seconds
    } catch (error) {
        logger.warn('Failed to record prediction metrics', { error });
    }
}

/**
 * Update model health gauge
 */
export function updateModelHealth(
    modelType: MLModelType,
    version: string,
    isHealthy: boolean
): void {
    try {
        mlModelHealthGauge.labels(modelType, version).set(isHealthy ? 1 : 0);
    } catch (error) {
        logger.warn('Failed to update model health metric', { error });
    }
}

/**
 * Record A/B experiment assignment
 */
export function recordExperimentAssignment(
    experimentId: string,
    variant: VariantType
): void {
    try {
        mlExperimentAssignmentsTotal.labels(experimentId, variant).inc();
    } catch (error) {
        logger.warn('Failed to record experiment assignment', { error });
    }
}

/**
 * Record prediction with full context (convenience wrapper)
 */
export function recordPredictionWithContext(params: {
    modelType: MLModelType;
    variant: VariantType;
    status: PredictionStatus;
    latencyMs: number;
    experimentId?: string | null;
}): void {
    recordPrediction(params.modelType, params.variant, params.status, params.latencyMs);

    if (params.experimentId) {
        recordExperimentAssignment(params.experimentId, params.variant);
    }
}
