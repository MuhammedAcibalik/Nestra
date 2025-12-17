/**
 * Prometheus Metrics
 * Application metrics for monitoring and observability
 * Following Microservice Pattern: Observability, Metrics
 */
import * as promClient from 'prom-client';
export declare const metricsRegistry: promClient.Registry<"text/plain; version=0.0.4; charset=utf-8">;
export declare const httpRequestsTotal: promClient.Counter<"route" | "method" | "status_code">;
export declare const httpRequestDuration: promClient.Histogram<"route" | "method" | "status_code">;
export declare const httpActiveRequests: promClient.Gauge<string>;
export declare const optimizationTasksTotal: promClient.Counter<"type" | "status">;
export declare const optimizationDuration: promClient.Histogram<"type" | "algorithm">;
export declare const piscinaUtilization: promClient.Gauge<string>;
export declare const piscinaQueueSize: promClient.Gauge<string>;
export declare const piscinaCompleted: promClient.Counter<string>;
export declare const rabbitmqMessagesPublished: promClient.Counter<"event_type">;
export declare const rabbitmqMessagesConsumed: promClient.Counter<"status" | "queue">;
export declare const rabbitmqConnectionState: promClient.Gauge<string>;
export declare const circuitBreakerStateGauge: promClient.Gauge<"name">;
export declare const circuitBreakerCallsTotal: promClient.Counter<"name" | "result">;
export declare function getMetrics(): Promise<string>;
export declare function getMetricsContentType(): string;
/**
 * Update Piscina metrics from pool stats
 */
export declare function updatePiscinaMetrics(stats: {
    utilization: number;
    queueSize: number;
    completed: number;
}): void;
/**
 * Record optimization completion
 */
export declare function recordOptimization(type: '1D' | '2D', algorithm: string, success: boolean, durationSeconds: number): void;
//# sourceMappingURL=metrics.d.ts.map