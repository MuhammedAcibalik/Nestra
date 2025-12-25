/**
 * OpenTelemetry Tracing Configuration
 * Distributed tracing for observability
 * Following Single Responsibility Principle (SRP)
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('Tracing');

// Semantic convention attribute keys (stable)
const SERVICE_NAME = 'service.name';
const SERVICE_VERSION = 'service.version';
const DEPLOYMENT_ENVIRONMENT = 'deployment.environment';

export interface ITracingConfig {
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    otlpEndpoint?: string;
    enabled?: boolean;
}

let sdk: NodeSDK | null = null;
let isInitialized = false;

/**
 * Get default tracing configuration from environment
 */
function getDefaultConfig(): ITracingConfig {
    return {
        serviceName: process.env.OTEL_SERVICE_NAME ?? 'nestra-backend',
        serviceVersion: process.env.npm_package_version ?? '1.0.0',
        environment: process.env.NODE_ENV ?? 'development',
        otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
        enabled: process.env.USE_TRACING === 'true'
    };
}

/**
 * Initialize OpenTelemetry SDK
 * Call this at the very beginning of your application, before any other imports
 */
export function initializeTracing(config?: ITracingConfig): void {
    if (isInitialized) {
        logger.warn('Tracing already initialized');
        return;
    }

    const finalConfig = { ...getDefaultConfig(), ...config };

    if (!finalConfig.enabled) {
        logger.info('Tracing disabled (USE_TRACING != true)');
        return;
    }

    try {
        // Create OTLP exporter (works with Jaeger OTLP endpoint)
        const traceExporter = new OTLPTraceExporter({
            url: finalConfig.otlpEndpoint
        });

        // Create resource with service information
        const resource = resourceFromAttributes({
            [SERVICE_NAME]: finalConfig.serviceName ?? 'nestra-backend',
            [SERVICE_VERSION]: finalConfig.serviceVersion ?? '1.0.0',
            [DEPLOYMENT_ENVIRONMENT]: finalConfig.environment ?? 'development'
        });

        // Create and configure the SDK
        sdk = new NodeSDK({
            resource,
            traceExporter,
            instrumentations: [
                getNodeAutoInstrumentations({
                    // Instrument HTTP requests
                    '@opentelemetry/instrumentation-http': {
                        enabled: true
                    },
                    // Instrument Express
                    '@opentelemetry/instrumentation-express': {
                        enabled: true
                    },
                    // Instrument PostgreSQL
                    '@opentelemetry/instrumentation-pg': {
                        enabled: true
                    },
                    // Instrument Redis (ioredis)
                    '@opentelemetry/instrumentation-ioredis': {
                        enabled: true
                    },
                    // Disable file system instrumentation (too noisy)
                    '@opentelemetry/instrumentation-fs': {
                        enabled: false
                    },
                    // Disable DNS instrumentation
                    '@opentelemetry/instrumentation-dns': {
                        enabled: false
                    }
                })
            ]
        });

        // Start the SDK
        sdk.start();

        isInitialized = true;
        logger.info('Tracing initialized', {
            serviceName: finalConfig.serviceName,
            otlpEndpoint: finalConfig.otlpEndpoint
        });

    } catch (error) {
        logger.error('Failed to initialize tracing', { error });
    }
}

/**
 * Shutdown tracing gracefully
 */
export async function shutdownTracing(): Promise<void> {
    if (!sdk || !isInitialized) {
        return;
    }

    try {
        await sdk.shutdown();
        isInitialized = false;
        logger.info('Tracing shutdown complete');
    } catch (error) {
        logger.error('Error shutting down tracing', { error });
    }
}

/**
 * Check if tracing is enabled and initialized
 */
export function isTracingEnabled(): boolean {
    return isInitialized;
}
