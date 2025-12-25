"use strict";
/**
 * OpenTelemetry Tracing Configuration
 * Distributed tracing for observability
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeTracing = initializeTracing;
exports.shutdownTracing = shutdownTracing;
exports.isTracingEnabled = isTracingEnabled;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('Tracing');
// Semantic convention attribute keys (stable)
const SERVICE_NAME = 'service.name';
const SERVICE_VERSION = 'service.version';
const DEPLOYMENT_ENVIRONMENT = 'deployment.environment';
let sdk = null;
let isInitialized = false;
/**
 * Get default tracing configuration from environment
 */
function getDefaultConfig() {
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
function initializeTracing(config) {
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
        const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
            url: finalConfig.otlpEndpoint
        });
        // Create resource with service information
        const resource = (0, resources_1.resourceFromAttributes)({
            [SERVICE_NAME]: finalConfig.serviceName ?? 'nestra-backend',
            [SERVICE_VERSION]: finalConfig.serviceVersion ?? '1.0.0',
            [DEPLOYMENT_ENVIRONMENT]: finalConfig.environment ?? 'development'
        });
        // Create and configure the SDK
        sdk = new sdk_node_1.NodeSDK({
            resource,
            traceExporter,
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
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
    }
    catch (error) {
        logger.error('Failed to initialize tracing', { error });
    }
}
/**
 * Shutdown tracing gracefully
 */
async function shutdownTracing() {
    if (!sdk || !isInitialized) {
        return;
    }
    try {
        await sdk.shutdown();
        isInitialized = false;
        logger.info('Tracing shutdown complete');
    }
    catch (error) {
        logger.error('Error shutting down tracing', { error });
    }
}
/**
 * Check if tracing is enabled and initialized
 */
function isTracingEnabled() {
    return isInitialized;
}
//# sourceMappingURL=otel.config.js.map