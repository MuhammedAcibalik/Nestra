/**
 * Metrics Service
 * Provides Prometheus-compatible metrics for monitoring
 * Following Microservice Pattern: Observability
 */
export interface IMetric {
    name: string;
    type: 'counter' | 'gauge' | 'histogram';
    help: string;
    value: number;
    labels?: Record<string, string>;
}
export interface IMetricsService {
    incrementCounter(name: string, labels?: Record<string, string>): void;
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    getMetrics(): string;
    getMetricsJson(): IMetric[];
}
export declare class MetricsService implements IMetricsService {
    private readonly metrics;
    private readonly defaultHistogramBuckets;
    constructor();
    private initializeDefaultMetrics;
    private labelsToKey;
    incrementCounter(name: string, labels?: Record<string, string>): void;
    setGauge(name: string, value: number, labels?: Record<string, string>): void;
    recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
    getMetrics(): string;
    getMetricsJson(): IMetric[];
    updateSystemMetrics(): void;
}
export declare function getMetricsService(): MetricsService;
//# sourceMappingURL=metrics.service.d.ts.map