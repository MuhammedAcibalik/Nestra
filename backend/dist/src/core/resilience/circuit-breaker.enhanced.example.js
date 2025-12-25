"use strict";
/**
 * Enhanced Circuit Breaker with OpenTelemetry Tracing
 * Example implementation using semantic conventions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerManager = exports.defaultCircuitBreakerConfig = void 0;
const opossum_1 = __importDefault(require("opossum"));
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const metrics_1 = require("../monitoring/metrics");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('CircuitBreaker');
const tracer = api_1.trace.getTracer('circuit-breaker', '1.0.0');
// ==================== DEFAULT CONFIG ====================
exports.defaultCircuitBreakerConfig = {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 10000,
    volumeThreshold: 5,
    enableTracing: true // Enable by default
};
// ==================== ENHANCED CIRCUIT BREAKER ====================
class CircuitBreakerManager {
    static breakers = new Map();
    /**
     * Create a traced circuit breaker
     */
    static create(action, config, fallback) {
        const fullConfig = {
            ...exports.defaultCircuitBreakerConfig,
            ...config
        };
        // Wrap action with tracing if enabled
        const tracedAction = fullConfig.enableTracing
            ? this.wrapWithTracing(action, config.name)
            : action;
        const breaker = new opossum_1.default(tracedAction, {
            timeout: fullConfig.timeout,
            errorThresholdPercentage: fullConfig.errorThresholdPercentage,
            resetTimeout: fullConfig.resetTimeout,
            volumeThreshold: fullConfig.volumeThreshold
        });
        if (fallback) {
            breaker.fallback(fallback);
        }
        this.setupEventListeners(breaker, config.name);
        this.breakers.set(config.name, breaker);
        logger.info('Created', { name: config.name, tracing: fullConfig.enableTracing });
        return breaker;
    }
    /**
     * Wrap function with OpenTelemetry tracing
     */
    static wrapWithTracing(fn, serviceName) {
        return async function (...args) {
            // Start a new span
            const span = tracer.startSpan('circuit_breaker.execute', {
                attributes: {
                    [semantic_conventions_1.ATTR_SERVICE_NAME]: serviceName,
                    'circuit_breaker.operation': fn.name || 'anonymous'
                }
            });
            return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
                try {
                    const result = await fn(...args);
                    // Success
                    span.setStatus({ code: api_1.SpanStatusCode.OK });
                    span.setAttribute('circuit_breaker.result', 'success');
                    return result;
                }
                catch (error) {
                    // Failure
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
     * Setup enhanced event listeners with state tracking
     */
    static setupEventListeners(breaker, name) {
        // State changes
        breaker.on('open', () => {
            logger.warn('Circuit opened (too many failures)', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(2); // OPEN
            // Record span event
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.opened', {
                'circuit_breaker.name': name
            });
        });
        breaker.on('halfOpen', () => {
            logger.info('Circuit half-open (testing)', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(1); // HALF_OPEN
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.half_opened', {
                'circuit_breaker.name': name
            });
        });
        breaker.on('close', () => {
            logger.info('Circuit closed (healthy)', { name });
            metrics_1.circuitBreakerStateGauge.labels(name).set(0); // CLOSED
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.closed', {
                'circuit_breaker.name': name
            });
        });
        // Execution events
        breaker.on('timeout', () => {
            logger.warn('Operation timeout', { name });
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.timeout', {
                'circuit_breaker.name': name
            });
        });
        breaker.on('reject', () => {
            logger.warn('Operation rejected (circuit open)', { name });
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.rejected', {
                'circuit_breaker.name': name
            });
        });
        breaker.on('fallback', (result) => {
            logger.info('Fallback executed', { name });
            const span = api_1.trace.getActiveSpan();
            span?.addEvent('circuit_breaker.fallback', {
                'circuit_breaker.name': name,
                'circuit_breaker.fallback_type': typeof result
            });
        });
    }
    /**
     * Get circuit breaker stats with tracing context
     */
    static getStats(name) {
        const breaker = this.breakers.get(name);
        if (!breaker)
            return null;
        const stats = breaker.stats;
        return {
            name,
            state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
            successes: stats.successes,
            failures: stats.failures,
            fallbacks: stats.fallbacks,
            rejects: stats.rejects,
            timeouts: stats.timeouts
        };
    }
    /**
     * Get all registered circuit breakers
     */
    static getAllStats() {
        return Array.from(this.breakers.keys())
            .map((name) => this.getStats(name))
            .filter((stats) => stats !== null);
    }
}
exports.CircuitBreakerManager = CircuitBreakerManager;
//# sourceMappingURL=circuit-breaker.enhanced.example.js.map