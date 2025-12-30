/**
 * Anomaly Domain Models
 * Types for statistical anomaly detection
 */

// ==================== ANOMALY TYPES ====================

export type AnomalyType = 'spike' | 'drop' | 'outlier' | 'pattern' | 'trend_break';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyStatus = 'new' | 'acknowledged' | 'resolved' | 'ignored';

export interface IAnomaly {
    id: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    status: AnomalyStatus;
    metric: string;
    value: number;
    expected: number;
    deviation: number;        // Standard deviations from mean
    deviationPercent: number; // Percentage deviation
    detectedAt: Date;
    resolvedAt?: Date;
    source: {
        entity: string;       // 'order', 'stock', 'production'
        entityId?: string;
        tenantId?: string;
    };
    context: Record<string, unknown>;
    description: string;
}

export interface IAnomalyFilter {
    type?: AnomalyType;
    severity?: AnomalySeverity;
    status?: AnomalyStatus;
    metric?: string;
    since?: Date;
    until?: Date;
    limit?: number;
}

// ==================== DETECTION CONFIG ====================

export interface IAnomalyDetectionConfig {
    /** Number of standard deviations for outlier detection */
    zScoreThreshold: number;
    /** Minimum data points required for detection */
    minDataPoints: number;
    /** Moving average window size */
    movingAverageWindow: number;
    /** Enable pattern detection */
    detectPatterns: boolean;
    /** Severity thresholds */
    severityThresholds: {
        low: number;      // 1.5-2 sigma
        medium: number;   // 2-2.5 sigma
        high: number;     // 2.5-3 sigma
        critical: number; // 3+ sigma
    };
}

export const DEFAULT_ANOMALY_CONFIG: IAnomalyDetectionConfig = {
    zScoreThreshold: 2.5,
    minDataPoints: 7,
    movingAverageWindow: 5,
    detectPatterns: true,
    severityThresholds: {
        low: 1.5,
        medium: 2.0,
        high: 2.5,
        critical: 3.0
    }
};

// ==================== DETECTION RESULT ====================

export interface IAnomalyDetectionResult {
    anomalies: IAnomaly[];
    stats: {
        totalChecked: number;
        anomaliesFound: number;
        bySeverity: Record<AnomalySeverity, number>;
        byType: Record<AnomalyType, number>;
    };
    analysisWindow: {
        start: Date;
        end: Date;
    };
}

// ==================== STATISTICAL CONTEXT ====================

export interface IStatisticalContext {
    mean: number;
    standardDeviation: number;
    median: number;
    min: number;
    max: number;
    count: number;
    movingAverage: number[];
}
