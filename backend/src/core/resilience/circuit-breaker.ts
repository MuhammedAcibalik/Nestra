/**
 * Circuit Breaker Pattern
 * Fault tolerance wrapper using opossum
 * Following Microservice Pattern: Resilience, Fail-Fast
 */

import CircuitBreaker from 'opossum';
import { circuitBreakerStateGauge } from '../monitoring/metrics';

// ==================== INTERFACES ====================

export interface ICircuitBreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    volumeThreshold?: number;
    name: string;
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
    timeout: 30000,              // 30s timeout
    errorThresholdPercentage: 50, // Open after 50% failures
    resetTimeout: 10000,         // 10s before half-open
    volumeThreshold: 5           // Min 5 requests before evaluation
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

        const breaker = new CircuitBreaker(action, {
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

        console.log(`[CIRCUIT BREAKER] Created: ${config.name}`);
        return breaker;
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
            console.warn(`[CIRCUIT BREAKER] ${name} OPENED`);
            circuitBreakerStateGauge.labels(name).set(1);
        });

        breaker.on('halfOpen', () => {
            console.log(`[CIRCUIT BREAKER] ${name} HALF-OPEN`);
            circuitBreakerStateGauge.labels(name).set(2);
        });

        breaker.on('close', () => {
            console.log(`[CIRCUIT BREAKER] ${name} CLOSED`);
            circuitBreakerStateGauge.labels(name).set(0);
        });

        breaker.on('fallback', () => {
            console.log(`[CIRCUIT BREAKER] ${name} fallback executed`);
        });

        breaker.on('timeout', () => {
            console.warn(`[CIRCUIT BREAKER] ${name} timeout`);
        });

        breaker.on('reject', () => {
            console.warn(`[CIRCUIT BREAKER] ${name} rejected (circuit open)`);
        });
    }

    /**
     * Shutdown all breakers
     */
    static async shutdownAll(): Promise<void> {
        for (const [name, breaker] of this.breakers) {
            breaker.shutdown();
            console.log(`[CIRCUIT BREAKER] ${name} shutdown`);
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
