/**
 * OpenTelemetry Tracing Bootstrap
 * This file MUST be loaded BEFORE any other modules using --require flag
 * This ensures auto-instrumentation patches are applied before modules are loaded
 */

import dotenv from 'dotenv';
dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { createModuleLogger } from './core/logger';

const logger = createModuleLogger('Tracing');

// Check if tracing is enabled
const USE_TRACING = process.env.USE_TRACING === 'true';

if (USE_TRACING) {
    logger.info('Initializing OpenTelemetry...');

    const serviceName = process.env.OTEL_SERVICE_NAME ?? 'nestra-backend';
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces';
    const environment = process.env.NODE_ENV ?? 'development';

    const traceExporter = new OTLPTraceExporter({
        url: otlpEndpoint
    });

    const resource = resourceFromAttributes({
        'service.name': serviceName,
        'service.version': process.env.npm_package_version ?? '1.0.0',
        'deployment.environment': environment
    });

    const sdk = new NodeSDK({
        resource,
        traceExporter,
        instrumentations: [
            getNodeAutoInstrumentations({
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
} else {
    logger.debug('Disabled (USE_TRACING != true)');
}
