/**
 * Circuit Breaker Pattern
 * Fault tolerance wrapper using opossum
 * Following Microservice Pattern: Resilience, Fail-Fast
 */

import CircuitBreaker from 'opossum';
import { trace, SpanStatusCode, context } from '@opentelemetry/api';
import { ATTR_ERROR_TYPE } from '@opentelemetry/semantic-conventions';
import { circuitBreakerStateGauge } from '../monitoring/metrics';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('CircuitBreaker');
const tracer = trace.getTracer('circuit-breaker', '1.0.0');

// ==================== INTERFACES ====================

export interface ICircuitBreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
    name: string;
    enableTracing?: boolean;
}

export interface ICircuitBreakerStats {
    name: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    successes: number;
    failures: number;
    fallbacks: number;
    rejects: number;
    timeouts: number;
}

// ==================== DEFAULT CONFIG ====================

export const defaultCircuitBreakerConfig: Omit<Required<ICircuitBreakerConfig>, 'name'> = {
    timeout: 30000, // 30s timeout
    errorThresholdPercentage: 50, // Open after 50% failures
    resetTimeout: 10000, // 10s before half-open
    volumeThreshold: 5, // Min 5 requests before evaluation
    enableTracing: true // Enable distributed tracing
};

// ==================== CIRCUIT BREAKER MANAGER ====================

export class CircuitBreakerManager {
    private static readonly breakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Create a circuit breaker for an async function
     */
    static create<TArgs extends unknown[], TResult>(
        action: (...args: TArgs) => Promise<TResult>,
        config: ICircuitBreakerConfig,
        fallback?: (...args: TArgs) => TResult | Promise<TResult>
    ): CircuitBreaker<TArgs, TResult> {
        const fullConfig = {
            ...defaultCircuitBreakerConfig,
            ...config
        };

        // Wrap action with tracing if enabled
        const tracedAction = fullConfig.enableTracing ? this.wrapWithTracing(action, config.name) : action;

        const breaker = new CircuitBreaker(tracedAction, {
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
    private static wrapWithTracing<TArgs extends unknown[], TResult>(
        fn: (...args: TArgs) => Promise<TResult>,
        serviceName: string
    ): (...args: TArgs) => Promise<TResult> {
        return async function (...args: TArgs): Promise<TResult> {
            const span = tracer.startSpan('circuit_breaker.execute', {
                attributes: {
                    'service.name': serviceName,
                    'circuit_breaker.operation': fn.name || 'anonymous'
                }
            });

            return context.with(trace.setSpan(context.active(), span), async () => {
                try {
                    const result = await fn(...args);
                    span.setStatus({ code: SpanStatusCode.OK });
                    span.setAttribute('circuit_breaker.result', 'success');
                    return result;
                } catch (error) {
                    span.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : String(error)
                    });
                    if (error instanceof Error) {
                        span.setAttribute(ATTR_ERROR_TYPE, error.name);
                        span.recordException(error);
                    }
                    throw error;
                } finally {
                    span.end();
                }
            });
        };
    }

    /**
     * Get existing breaker by name
     */
    static get(name: string): CircuitBreaker | undefined {
        return this.breakers.get(name);
    }

    /**
     * Get all breaker stats
     */
    static getAllStats(): ICircuitBreakerStats[] {
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
    private static getState(breaker: CircuitBreaker): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
        if (breaker.opened) return 'OPEN';
        if (breaker.halfOpen) return 'HALF_OPEN';
        return 'CLOSED';
    }

    /**
     * Get state as number for Prometheus
     */
    private static getStateNumber(breaker: CircuitBreaker): number {
        if (breaker.opened) return 1; // OPEN
        if (breaker.halfOpen) return 2; // HALF_OPEN
        return 0; // CLOSED
    }

    /**
     * Setup event listeners for logging and metrics
     */
    private static setupEventListeners(breaker: CircuitBreaker, name: string): void {
        breaker.on('open', () => {
            logger.warn('Circuit opened', { name });
            circuitBreakerStateGauge.labels(name).set(1);
            trace.getActiveSpan()?.addEvent('circuit_breaker.opened', { 'circuit_breaker.name': name });
        });

        breaker.on('halfOpen', () => {
            logger.info('Circuit half-open', { name });
            circuitBreakerStateGauge.labels(name).set(2);
            trace.getActiveSpan()?.addEvent('circuit_breaker.half_opened', { 'circuit_breaker.name': name });
        });

        breaker.on('close', () => {
            logger.info('Circuit closed', { name });
            circuitBreakerStateGauge.labels(name).set(0);
            trace.getActiveSpan()?.addEvent('circuit_breaker.closed', { 'circuit_breaker.name': name });
        });

        breaker.on('fallback', () => {
            logger.debug('Fallback executed', { name });
            trace.getActiveSpan()?.addEvent('circuit_breaker.fallback', { 'circuit_breaker.name': name });
        });

        breaker.on('timeout', () => {
            logger.warn('Timeout', { name });
            trace.getActiveSpan()?.addEvent('circuit_breaker.timeout', { 'circuit_breaker.name': name });
        });

        breaker.on('reject', () => {
            logger.warn('Request rejected (circuit open)', { name });
            trace.getActiveSpan()?.addEvent('circuit_breaker.rejected', { 'circuit_breaker.name': name });
        });
    }

    /**
     * Shutdown all breakers
     */
    static async shutdownAll(): Promise<void> {
        for (const [name, breaker] of this.breakers) {
            breaker.shutdown();
            logger.debug('Shutdown', { name });
        }
        this.breakers.clear();
    }
}

// ==================== HELPER FUNCTIONS ====================

export function createCircuitBreaker<TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
    config: ICircuitBreakerConfig,
    fallback?: (...args: TArgs) => TResult | Promise<TResult>
): CircuitBreaker<TArgs, TResult> {
    return CircuitBreakerManager.create(action, config, fallback);
}

export function getCircuitBreakerStats(): ICircuitBreakerStats[] {
    return CircuitBreakerManager.getAllStats();
}
