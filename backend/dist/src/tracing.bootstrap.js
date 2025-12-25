"use strict";
/**
 * OpenTelemetry Tracing Bootstrap
 * This file MUST be loaded BEFORE any other modules using --require flag
 * This ensures auto-instrumentation patches are applied before modules are loaded
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const logger_1 = require("./core/logger");
const logger = (0, logger_1.createModuleLogger)('Tracing');
// Check if tracing is enabled
const USE_TRACING = process.env.USE_TRACING === 'true';
if (USE_TRACING) {
    logger.info('Initializing OpenTelemetry...');
    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'nestra-backend';
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';
    const environment = process.env.NODE_ENV ?? 'development';
    const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: otlpEndpoint
    });
    const resource = (0, resources_1.resourceFromAttributes)({
        'service.name': serviceName,
        'service.version': process.env.npm_package_version ?? '1.0.0',
        'deployment.environment': environment
    });
    const sdk = new sdk_node_1.NodeSDK({
        resource,
        traceExporter,
        instrumentations: [
            (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
                '@opentelemetry/instrumentation-http': { enabled: true },
                '@opentelemetry/instrumentation-express': { enabled: true },
                '@opentelemetry/instrumentation-pg': { enabled: true },
                '@opentelemetry/instrumentation-ioredis': { enabled: true },
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-dns': { enabled: false }
            })
        ]
    });
    sdk.start();
    logger.info('Initialized', { serviceName, otlpEndpoint });
    // Graceful shutdown
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => logger.info('Shutdown complete'))
            .catch((err) => logger.error('Shutdown error', { error: err }))
            .finally(() => process.exit(0));
    });
}
else {
    logger.debug('Disabled (USE_TRACING != true)');
}
//# sourceMappingURL=tracing.bootstrap.js.map