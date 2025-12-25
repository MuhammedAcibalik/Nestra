/**
 * OpenTelemetry Tracing Configuration
 * Distributed tracing for observability
 * Following Single Responsibility Principle (SRP)
 */
export interface ITracingConfig {
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    otlpEndpoint?: string;
    enabled?: boolean;
}
/**
 * Initialize OpenTelemetry SDK
 * Call this at the very beginning of your application, before any other imports
 */
export declare function initializeTracing(config?: ITracingConfig): void;
/**
 * Shutdown tracing gracefully
 */
export declare function shutdownTracing(): Promise<void>;
/**
 * Check if tracing is enabled and initialized
 */
export declare function isTracingEnabled(): boolean;
//# sourceMappingURL=otel.config.d.ts.map