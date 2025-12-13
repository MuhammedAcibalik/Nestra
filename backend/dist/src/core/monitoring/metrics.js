"use strict";
/**
 * Prometheus Metrics
 * Application metrics for monitoring and observability
 * Following Microservice Pattern: Observability, Metrics
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreakerCallsTotal = exports.circuitBreakerStateGauge = exports.rabbitmqConnectionState = exports.rabbitmqMessagesConsumed = exports.rabbitmqMessagesPublished = exports.piscinaCompleted = exports.piscinaQueueSize = exports.piscinaUtilization = exports.optimizationDuration = exports.optimizationTasksTotal = exports.httpActiveRequests = exports.httpRequestDuration = exports.httpRequestsTotal = exports.metricsRegistry = void 0;
exports.getMetrics = getMetrics;
exports.getMetricsContentType = getMetricsContentType;
exports.updatePiscinaMetrics = updatePiscinaMetrics;
exports.recordOptimization = recordOptimization;
const promClient = __importStar(require("prom-client"));
// ==================== REGISTRY ====================
exports.metricsRegistry = new promClient.Registry();
// Add default metrics (CPU, memory, event loop)
promClient.collectDefaultMetrics({
    register: exports.metricsRegistry,
    prefix: 'nestra_'
});
// ==================== HTTP METRICS ====================
exports.httpRequestsTotal = new promClient.Counter({
    name: 'nestra_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [exports.metricsRegistry]
});
exports.httpRequestDuration = new promClient.Histogram({
    name: 'nestra_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [exports.metricsRegistry]
});
exports.httpActiveRequests = new promClient.Gauge({
    name: 'nestra_http_active_requests',
    help: 'Number of active HTTP requests',
    registers: [exports.metricsRegistry]
});
// ==================== OPTIMIZATION METRICS ====================
exports.optimizationTasksTotal = new promClient.Counter({
    name: 'nestra_optimization_tasks_total',
    help: 'Total optimization tasks',
    labelNames: ['type', 'status'],
    registers: [exports.metricsRegistry]
});
exports.optimizationDuration = new promClient.Histogram({
    name: 'nestra_optimization_duration_seconds',
    help: 'Optimization task duration in seconds',
    labelNames: ['type', 'algorithm'],
    buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
    registers: [exports.metricsRegistry]
});
// ==================== PISCINA POOL METRICS ====================
exports.piscinaUtilization = new promClient.Gauge({
    name: 'nestra_piscina_utilization',
    help: 'Piscina pool utilization (0-1)',
    registers: [exports.metricsRegistry]
});
exports.piscinaQueueSize = new promClient.Gauge({
    name: 'nestra_piscina_queue_size',
    help: 'Number of tasks in Piscina queue',
    registers: [exports.metricsRegistry]
});
exports.piscinaCompleted = new promClient.Counter({
    name: 'nestra_piscina_tasks_completed_total',
    help: 'Total completed Piscina tasks',
    registers: [exports.metricsRegistry]
});
// ==================== RABBITMQ METRICS ====================
exports.rabbitmqMessagesPublished = new promClient.Counter({
    name: 'nestra_rabbitmq_messages_published_total',
    help: 'Total messages published to RabbitMQ',
    labelNames: ['event_type'],
    registers: [exports.metricsRegistry]
});
exports.rabbitmqMessagesConsumed = new promClient.Counter({
    name: 'nestra_rabbitmq_messages_consumed_total',
    help: 'Total messages consumed from RabbitMQ',
    labelNames: ['queue', 'status'],
    registers: [exports.metricsRegistry]
});
exports.rabbitmqConnectionState = new promClient.Gauge({
    name: 'nestra_rabbitmq_connection_state',
    help: 'RabbitMQ connection state (0=disconnected, 1=connected)',
    registers: [exports.metricsRegistry]
});
// ==================== CIRCUIT BREAKER METRICS ====================
exports.circuitBreakerStateGauge = new promClient.Gauge({
    name: 'nestra_circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['name'],
    registers: [exports.metricsRegistry]
});
exports.circuitBreakerCallsTotal = new promClient.Counter({
    name: 'nestra_circuit_breaker_calls_total',
    help: 'Total circuit breaker calls',
    labelNames: ['name', 'result'],
    registers: [exports.metricsRegistry]
});
// ==================== HELPER FUNCTIONS ====================
async function getMetrics() {
    return exports.metricsRegistry.metrics();
}
function getMetricsContentType() {
    return exports.metricsRegistry.contentType;
}
/**
 * Update Piscina metrics from pool stats
 */
function updatePiscinaMetrics(stats) {
    exports.piscinaUtilization.set(stats.utilization);
    exports.piscinaQueueSize.set(stats.queueSize);
}
/**
 * Record optimization completion
 */
function recordOptimization(type, algorithm, success, durationSeconds) {
    exports.optimizationTasksTotal.labels(type, success ? 'success' : 'failure').inc();
    exports.optimizationDuration.labels(type, algorithm).observe(durationSeconds);
}
//# sourceMappingURL=metrics.js.map