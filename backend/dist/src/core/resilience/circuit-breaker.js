"use strict";
/**
 * Circuit Breaker Pattern
 * Fault tolerance wrapper using opossum
 * Following Microservice Pattern: Resilience, Fail-Fast
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerManager = exports.defaultCircuitBreakerConfig = void 0;
exports.createCircuitBreaker = createCircuitBreaker;
exports.getCircuitBreakerStats = getCircuitBreakerStats;
const opossum_1 = __importDefault(require("opossum"));
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('CircuitBreaker');
const tracer = api_1.trace.getTracer('circuit-breaker', '1.0.0');
// ==================== DEFAULT CONFIG ====================
exports.defaultCircuitBreakerConfig = {
    timeout: 30000, // 30s timeout
    errorThresholdPercentage: 50, // Open after 50% failures
    resetTimeout: 10000, // 10s before half-open
    volumeThreshold: 5, // Min 5 requests before evaluation
    enableTracing: true // Enable distributed tracing
};
// ==================== CIRCUIT BREAKER MANAGER ====================
class CircuitBreakerManager {
    static breakers = new Map();
    /**
     * Create a circuit breaker for an async function
     */
    static create(action, config, fallback) {
        const fullConfig = {
            ...exports.defaultCircuitBreakerConfig,
            ...config
        };
        // Wrap action with tracing if enabled
        const tracedAction = fullConfig.enableTracing ? this.wrapWithTracing(action, config.name) : action;
        const breaker = new opossum_1.default(tracedAction, {
            timeout: fullConfig.timeout,
            errorThresholdPercentage: fullConfig.errorThresholdPercentage,
            resetTimeout: fullConfig.resetTimeout,
            volumeThreshold: fullConfig.volumeThreshold
        });
        // Set fallback if provided
        if (fallback) {
            breaker.fallback(fallback);
        }
        // Setup event listeners for monitoring
        this.setupEventListeners(breaker, config.name);
        // Store for later access
        this.breakers.set(config.name, breaker);
        logger.info('Created', { name: config.name, tracing: fullConfig.enableTracing });
        return breaker;
    }
    /**
     * Wrap function with OpenTelemetry tracing
     */
    static wrapWithTracing(fn, serviceName) {
        return async function (...args) {
            const span = tracer.startSpan('circuit_breaker.execute', {
                attributes: {
                    'service.name': serviceName,
                    'circuit_breaker.operation': fn.name || 'anonymous'
                }
            });
            return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
                try {
                    const result = await fn(...args);
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    span.setAttribute('circuit_breaker.result', 'success');
                    return result;
                }
                catch (error) {
                    span.setStatus({
                        code: api_1.SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : String(error)
                    });
                    if (error instanceof Error) {
                        span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                        span.recordException(error);
                    }
                    throw error;
                }
                finally {
                    span.end();
                }
            });
        };
    }
    /**
     * Get existing breaker by name
     */
    static get(name) {
        return this.breakers.get(name);
    }
    /**
     * Get all breaker stats
     */
    static getAllStats() {
        return Array.from(this.breakers.entries()).map(([name, breaker]) => ({
            name,
            state: this.getState(breaker),
            successes: breaker.stats.successes,
            failures: breaker.stats.failures,
            fallbacks: breaker.stats.fallbacks,
            rejects: breaker.stats.rejects,
            timeouts: breaker.stats.timeouts
        }));
    }
    /**
     * Get state string
     */
    static getState(breaker) {
        if (breaker.opened)
            return 'OPEN';
        if (breaker.halfOpen)
            return 'HALF_OPEN';
        return 'CLOSED';
    }
    /**
     * Get state as number for Prometheus
     */
    static getStateNumber(breaker) {
        if (breaker.opened)
            return 1; // OPEN
        if (breaker.halfOpen)
            return 2; // HALF_OPEN
        return 0; // CLOSED
    }
    /**
     * Setup event listeners for logging and metrics
     */
    static setupEventListeners(breaker, name) {
        breaker.on('open', () => {
            logger.warn('Circuit opened', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(1);
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.opened', { 'circuit_breaker.name': name });
        });
        breaker.on('halfOpen', () => {
            logger.info('Circuit half-open', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(2);
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.half_opened', { 'circuit_breaker.name': name });
        });
        breaker.on('close', () => {
            logger.info('Circuit closed', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(0);
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.closed', { 'circuit_breaker.name': name });
        });
        breaker.on('fallback', () => {
            logger.debug('Fallback executed', { name });
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.fallback', { 'circuit_breaker.name': name });
        });
        breaker.on('timeout', () => {
            logger.warn('Timeout', { name });
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.timeout', { 'circuit_breaker.name': name });
        });
        breaker.on('reject', () => {
            logger.warn('Request rejected (circuit open)', { name });
            api_1.trace.getActiveSpan()?.addEvent('circuit_breaker.rejected', { 'circuit_breaker.name': name });
        });
    }
    /**
     * Shutdown all breakers
     */
    static async shutdownAll() {
        for (const [name, breaker] of this.breakers) {
            breaker.shutdown();
            logger.debug('Shutdown', { name });
        }
        this.breakers.clear();
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
// ==================== HELPER FUNCTIONS ====================
function createCircuitBreaker(action, config, fallback) {
    return CircuitBreakerManager.create(action, config, fallback);
}
function getCircuitBreakerStats() {
    return CircuitBreakerManager.getAllStats();
}
//# sourceMappingURL=circuit-breaker.js.map