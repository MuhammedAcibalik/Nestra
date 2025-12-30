/**
 * Anomaly Detection Service
 * Statistical anomaly detection using Z-score and moving averages
 */

import { v4 as uuidv4 } from 'uuid';
import { IResult, success, failure } from '../../../core/interfaces';
import { createModuleLogger } from '../../../core/logger';
import { EventBus } from '../../../core/events/event-bus';
import {
    IAnomaly,
    IAnomalyFilter,
    IAnomalyDetectionResult,
    AnomalyType,
    AnomalySeverity,
    DEFAULT_ANOMALY_CONFIG,
    IAnomalyDetectionConfig,
    ForecastMetric
} from '../domain';
import { IAnalyticsRepository } from '../infrastructure/analytics.repository';
import {
    mean,
    standardDeviation,
    zScore,
    simpleMovingAverage
} from '../infrastructure/time-series.helper';

const logger = createModuleLogger('AnomalyService');

// ==================== INTERFACE ====================

export interface IAnomalyService {
    detectAnomalies(config?: Partial<IAnomalyDetectionConfig>): Promise<IResult<IAnomalyDetectionResult>>;
    getRecentAnomalies(filter: IAnomalyFilter): Promise<IResult<IAnomaly[]>>;
    acknowledgeAnomaly(id: string): Promise<IResult<void>>;
    resolveAnomaly(id: string): Promise<IResult<void>>;
}

// ==================== IMPLEMENTATION ====================

export class AnomalyService implements IAnomalyService {
    private detectedAnomalies: Map<string, IAnomaly> = new Map();

    constructor(private readonly repository: IAnalyticsRepository) { }

    /**
     * Run anomaly detection across all metrics
     */
    async detectAnomalies(
        configOverride?: Partial<IAnomalyDetectionConfig>
    ): Promise<IResult<IAnomalyDetectionResult>> {
        try {
            const config = { ...DEFAULT_ANOMALY_CONFIG, ...configOverride };
            const anomalies: IAnomaly[] = [];

            const endDate = new Date();
            const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

            // Check order anomalies
            const orderAnomalies = await this.detectMetricAnomalies(
                'orders',
                startDate,
                endDate,
                config
            );
            anomalies.push(...orderAnomalies);

            // Check waste anomalies
            const wasteAnomalies = await this.detectMetricAnomalies(
                'waste',
                startDate,
                endDate,
                config
            );
            anomalies.push(...wasteAnomalies);

            // Check production anomalies
            const productionAnomalies = await this.detectMetricAnomalies(
                'production',
                startDate,
                endDate,
                config
            );
            anomalies.push(...productionAnomalies);

            // Store detected anomalies
            for (const anomaly of anomalies) {
                this.detectedAnomalies.set(anomaly.id, anomaly);

                // Emit event for high severity anomalies
                if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
                    await this.emitAnomalyEvent(anomaly);
                }
            }

            const result: IAnomalyDetectionResult = {
                anomalies,
                stats: {
                    totalChecked: 3, // metrics checked
                    anomaliesFound: anomalies.length,
                    bySeverity: this.countBySeverity(anomalies),
                    byType: this.countByType(anomalies)
                },
                analysisWindow: { start: startDate, end: endDate }
            };

            logger.info('Anomaly detection completed', {
                found: anomalies.length,
                high: result.stats.bySeverity.high,
                critical: result.stats.bySeverity.critical
            });

            return success(result);
        } catch (error) {
            logger.error('Anomaly detection failed', { error });
            return failure({
                code: 'ANOMALY_DETECTION_ERROR',
                message: 'Anomali tespiti başarısız',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }
    }

    /**
     * Get recent anomalies with filtering
     */
    async getRecentAnomalies(filter: IAnomalyFilter): Promise<IResult<IAnomaly[]>> {
        try {
            let anomalies = Array.from(this.detectedAnomalies.values());

            // Apply filters
            if (filter.type) {
                anomalies = anomalies.filter(a => a.type === filter.type);
            }
            if (filter.severity) {
                anomalies = anomalies.filter(a => a.severity === filter.severity);
            }
            if (filter.status) {
                anomalies = anomalies.filter(a => a.status === filter.status);
            }
            if (filter.metric) {
                anomalies = anomalies.filter(a => a.metric === filter.metric);
            }
            if (filter.since) {
                anomalies = anomalies.filter(a => a.detectedAt >= filter.since!);
            }
            if (filter.until) {
                anomalies = anomalies.filter(a => a.detectedAt <= filter.until!);
            }

            // Sort by detection date (newest first)
            anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

            // Apply limit
            if (filter.limit) {
                anomalies = anomalies.slice(0, filter.limit);
            }

            return success(anomalies);
        } catch (error) {
            logger.error('Failed to get anomalies', { error });
            return failure({
                code: 'GET_ANOMALIES_ERROR',
                message: 'Anomaliler alınamadı'
            });
        }
    }

    /**
     * Acknowledge an anomaly
     */
    async acknowledgeAnomaly(id: string): Promise<IResult<void>> {
        const anomaly = this.detectedAnomalies.get(id);
        if (!anomaly) {
            return failure({ code: 'NOT_FOUND', message: 'Anomali bulunamadı' });
        }

        anomaly.status = 'acknowledged';
        this.detectedAnomalies.set(id, anomaly);

        return success(undefined);
    }

    /**
     * Resolve an anomaly
     */
    async resolveAnomaly(id: string): Promise<IResult<void>> {
        const anomaly = this.detectedAnomalies.get(id);
        if (!anomaly) {
            return failure({ code: 'NOT_FOUND', message: 'Anomali bulunamadı' });
        }

        anomaly.status = 'resolved';
        anomaly.resolvedAt = new Date();
        this.detectedAnomalies.set(id, anomaly);

        return success(undefined);
    }

    // ==================== PRIVATE METHODS ====================

    private async detectMetricAnomalies(
        metric: ForecastMetric,
        startDate: Date,
        endDate: Date,
        config: IAnomalyDetectionConfig
    ): Promise<IAnomaly[]> {
        const anomalies: IAnomaly[] = [];

        try {
            const data = await this.repository.getAggregatedMetrics(
                metric,
                { startDate, endDate }
            );

            if (data.length < config.minDataPoints) {
                return anomalies;
            }

            const values = data.map(d => d.value);
            const avg = mean(values);
            const stdDev = standardDeviation(values);
            const movingAvg = simpleMovingAverage(values, config.movingAverageWindow);

            // Check each data point
            for (let i = 0; i < data.length; i++) {
                const value = values[i];
                const z = zScore(value, avg, stdDev);
                const absZ = Math.abs(z);

                // Check if this is an anomaly
                if (absZ >= config.severityThresholds.low) {
                    const severity = this.determineSeverity(absZ, config);
                    const type = this.determineType(z, values, i);

                    anomalies.push({
                        id: uuidv4(),
                        type,
                        severity,
                        status: 'new',
                        metric,
                        value,
                        expected: avg,
                        deviation: Math.round(z * 100) / 100,
                        deviationPercent: avg !== 0 ? Math.round(((value - avg) / avg) * 100 * 100) / 100 : 0,
                        detectedAt: data[i].date,
                        source: { entity: metric },
                        context: {
                            period: data[i].label,
                            mean: Math.round(avg * 100) / 100,
                            stdDev: Math.round(stdDev * 100) / 100
                        },
                        description: this.buildDescription(metric, type, severity, value, avg)
                    });
                }
            }
        } catch (error) {
            logger.warn('Metric anomaly detection failed', { metric, error });
        }

        return anomalies;
    }

    private determineSeverity(absZ: number, config: IAnomalyDetectionConfig): AnomalySeverity {
        if (absZ >= config.severityThresholds.critical) return 'critical';
        if (absZ >= config.severityThresholds.high) return 'high';
        if (absZ >= config.severityThresholds.medium) return 'medium';
        return 'low';
    }

    private determineType(z: number, values: number[], index: number): AnomalyType {
        if (z > 0) return 'spike';
        if (z < 0) return 'drop';
        return 'outlier';
    }

    private buildDescription(
        metric: string,
        type: AnomalyType,
        severity: AnomalySeverity,
        value: number,
        expected: number
    ): string {
        const metricLabels: Record<string, string> = {
            orders: 'Sipariş sayısı',
            waste: 'Fire oranı',
            production: 'Üretim sayısı',
            stock_consumption: 'Stok tüketimi'
        };

        const typeLabels: Record<AnomalyType, string> = {
            spike: 'beklenenden yüksek',
            drop: 'beklenenden düşük',
            outlier: 'anormal',
            pattern: 'beklenmedik patern',
            trend_break: 'trend kırılması'
        };

        const metricLabel = metricLabels[metric] ?? metric;
        const typeLabel = typeLabels[type];

        return `${metricLabel} ${typeLabel}: ${Math.round(value)} (beklenen: ${Math.round(expected)})`;
    }

    private countBySeverity(anomalies: IAnomaly[]): Record<AnomalySeverity, number> {
        return {
            low: anomalies.filter(a => a.severity === 'low').length,
            medium: anomalies.filter(a => a.severity === 'medium').length,
            high: anomalies.filter(a => a.severity === 'high').length,
            critical: anomalies.filter(a => a.severity === 'critical').length
        };
    }

    private countByType(anomalies: IAnomaly[]): Record<AnomalyType, number> {
        return {
            spike: anomalies.filter(a => a.type === 'spike').length,
            drop: anomalies.filter(a => a.type === 'drop').length,
            outlier: anomalies.filter(a => a.type === 'outlier').length,
            pattern: anomalies.filter(a => a.type === 'pattern').length,
            trend_break: anomalies.filter(a => a.type === 'trend_break').length
        };
    }

    private async emitAnomalyEvent(anomaly: IAnomaly): Promise<void> {
        try {
            const eventBus = EventBus.getInstance();
            await eventBus.publish({
                eventId: `anomaly_${anomaly.id}`,
                eventType: 'analytics.anomaly.detected',
                timestamp: new Date(),
                aggregateType: 'Analytics',
                aggregateId: anomaly.id,
                payload: {
                    anomalyId: anomaly.id,
                    type: anomaly.type,
                    severity: anomaly.severity,
                    metric: anomaly.metric,
                    value: anomaly.value,
                    expected: anomaly.expected
                }
            });
        } catch (error) {
            logger.warn('Failed to emit anomaly event', { error });
        }
    }
}
