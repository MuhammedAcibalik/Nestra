/**
 * Prometheus Metrics
 * Application metrics for monitoring and observability
 * Following Microservice Pattern: Observability, Metrics
 */

import * as promClient from 'prom-client';

// ==================== REGISTRY ====================

export const metricsRegistry = new promClient.Registry();

// Add default metrics (CPU, memory, event loop)
promClient.collectDefaultMetrics({
    register: metricsRegistry,
    prefix: 'nestra_'
});

// ==================== HTTP METRICS ====================

export const httpRequestsTotal = new promClient.Counter({
    name: 'nestra_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [metricsRegistry]
});

export const httpRequestDuration = new promClient.Histogram({
    name: 'nestra_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [metricsRegistry]
});

export const httpActiveRequests = new promClient.Gauge({
    name: 'nestra_http_active_requests',
    help: 'Number of active HTTP requests',
    registers: [metricsRegistry]
});

// ==================== OPTIMIZATION METRICS ====================

export const optimizationTasksTotal = new promClient.Counter({
    name: 'nestra_optimization_tasks_total',
    help: 'Total optimization tasks',
    labelNames: ['type', 'status'],
    registers: [metricsRegistry]
});

export const optimizationDuration = new promClient.Histogram({
    name: 'nestra_optimization_duration_seconds',
    help: 'Optimization task duration in seconds',
    labelNames: ['type', 'algorithm'],
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
    registers: [metricsRegistry]
});

// ==================== PISCINA POOL METRICS ====================

export const piscinaUtilization = new promClient.Gauge({
    name: 'nestra_piscina_utilization',
    help: 'Piscina pool utilization (0-1)',
    registers: [metricsRegistry]
});

export const piscinaQueueSize = new promClient.Gauge({
    name: 'nestra_piscina_queue_size',
    help: 'Number of tasks in Piscina queue',
    registers: [metricsRegistry]
});

export const piscinaCompleted = new promClient.Counter({
    name: 'nestra_piscina_tasks_completed_total',
    help: 'Total completed Piscina tasks',
    registers: [metricsRegistry]
});

// ==================== RABBITMQ METRICS ====================

export const rabbitmqMessagesPublished = new promClient.Counter({
    name: 'nestra_rabbitmq_messages_published_total',
    help: 'Total messages published to RabbitMQ',
    labelNames: ['event_type'],
    registers: [metricsRegistry]
});

export const rabbitmqMessagesConsumed = new promClient.Counter({
    name: 'nestra_rabbitmq_messages_consumed_total',
    help: 'Total messages consumed from RabbitMQ',
    labelNames: ['queue', 'status'],
    registers: [metricsRegistry]
});

export const rabbitmqConnectionState = new promClient.Gauge({
    name: 'nestra_rabbitmq_connection_state',
    help: 'RabbitMQ connection state (0=disconnected, 1=connected)',
    registers: [metricsRegistry]
});

// ==================== CIRCUIT BREAKER METRICS ====================

export const circuitBreakerStateGauge = new promClient.Gauge({
    name: 'nestra_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['name'],
    registers: [metricsRegistry]
});

export const circuitBreakerCallsTotal = new promClient.Counter({
    name: 'nestra_circuit_breaker_calls_total',
    help: 'Total circuit breaker calls',
    labelNames: ['name', 'result'],
    registers: [metricsRegistry]
});

// ==================== ML PREDICTION METRICS ====================

export const mlPredictionsTotal = new promClient.Counter({
    name: 'nestra_ml_predictions_total',
    help: 'Total ML predictions',
    labelNames: ['model_type', 'variant', 'status'],
    registers: [metricsRegistry]
});

export const mlPredictionLatency = new promClient.Histogram({
    name: 'nestra_ml_prediction_latency_seconds',
    help: 'ML prediction latency in seconds',
    labelNames: ['model_type'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    registers: [metricsRegistry]
});

export const mlModelHealthGauge = new promClient.Gauge({
    name: 'nestra_ml_model_health',
    help: 'ML model health (0=unhealthy, 1=healthy)',
    labelNames: ['model_type', 'version'],
    registers: [metricsRegistry]
});

export const mlExperimentAssignmentsTotal = new promClient.Counter({
    name: 'nestra_ml_experiment_assignments_total',
    help: 'Total A/B experiment assignments',
    labelNames: ['experiment_id', 'variant'],
    registers: [metricsRegistry]
});

// ==================== HELPER FUNCTIONS ====================

export async function getMetrics(): Promise<string> {
    return metricsRegistry.metrics();
}

export function getMetricsContentType(): string {
    return metricsRegistry.contentType;
}

/**
 * Update Piscina metrics from pool stats
 */
export function updatePiscinaMetrics(stats: { utilization: number; queueSize: number; completed: number }): void {
    piscinaUtilization.set(stats.utilization);
    piscinaQueueSize.set(stats.queueSize);
}

/**
 * Record optimization completion
 */
export function recordOptimization(
    type: '1D' | '2D',
    algorithm: string,
    success: boolean,
    durationSeconds: number
): void {
    optimizationTasksTotal.labels(type, success ? 'success' : 'failure').inc();
    optimizationDuration.labels(type, algorithm).observe(durationSeconds);
}
