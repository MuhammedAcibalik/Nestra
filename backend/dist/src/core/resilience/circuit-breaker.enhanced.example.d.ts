/**
 * Enhanced Circuit Breaker with OpenTelemetry Tracing
 * Example implementation using semantic conventions
 */
import CircuitBreaker from 'opossum';
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
export declare const defaultCircuitBreakerConfig: Omit<Required<ICircuitBreakerConfig>, 'name'>;
export declare class CircuitBreakerManager {
    private static readonly breakers;
    /**
     * Create a traced circuit breaker
     */
    static create<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>, config: ICircuitBreakerConfig, fallback?: (...args: TArgs) => TResult | Promise<TResult>): CircuitBreaker<TArgs, TResult>;
    /**
     * Wrap function with OpenTelemetry tracing
     */
    private static wrapWithTracing;
    /**
     * Setup enhanced event listeners with state tracking
     */
    private static setupEventListeners;
    /**
     * Get circuit breaker stats with tracing context
     */
    static getStats(name: string): ICircuitBreakerStats | null;
    /**
     * Get all registered circuit breakers
     */
    static getAllStats(): ICircuitBreakerStats[];
}
//# sourceMappingURL=circuit-breaker.enhanced.example.d.ts.map