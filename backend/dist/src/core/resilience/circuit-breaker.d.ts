/**
 * Circuit Breaker Pattern
 * Fault tolerance wrapper using opossum
 * Following Microservice Pattern: Resilience, Fail-Fast
 */
import CircuitBreaker from 'opossum';
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
export declare const defaultCircuitBreakerConfig: Omit<Required<ICircuitBreakerConfig>, 'name'>;
export declare class CircuitBreakerManager {
    private static readonly breakers;
    /**
     * Create a circuit breaker for an async function
     */
    static create<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>, config: ICircuitBreakerConfig, fallback?: (...args: TArgs) => TResult | Promise<TResult>): CircuitBreaker<TArgs, TResult>;
    /**
     * Get existing breaker by name
     */
    static get(name: string): CircuitBreaker | undefined;
    /**
     * Get all breaker stats
     */
    static getAllStats(): ICircuitBreakerStats[];
    /**
     * Get state string
     */
    private static getState;
    /**
     * Get state as number for Prometheus
     */
    private static getStateNumber;
    /**
     * Setup event listeners for logging and metrics
     */
    private static setupEventListeners;
    /**
     * Shutdown all breakers
     */
    static shutdownAll(): Promise<void>;
}
export declare function createCircuitBreaker<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>, config: ICircuitBreakerConfig, fallback?: (...args: TArgs) => TResult | Promise<TResult>): CircuitBreaker<TArgs, TResult>;
export declare function getCircuitBreakerStats(): ICircuitBreakerStats[];
//# sourceMappingURL=circuit-breaker.d.ts.map