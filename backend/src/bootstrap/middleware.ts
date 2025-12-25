/**
 * Express Middleware Configuration
 * Following Single Responsibility Principle (SRP)
 * Responsible for middleware setup only
 */

import { Express } from 'express';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';

// Middleware
import { metricsMiddleware } from '../middleware/metrics.middleware';
import { defaultRateLimiter } from '../middleware/rate-limit.middleware';
import { requestIdMiddleware } from '../middleware/request-id.middleware';
import { securityHeadersMiddleware } from '../middleware/security-headers.middleware';
import { compressionMiddleware } from '../middleware/compression.middleware';
import { defaultTimeout } from '../middleware/timeout.middleware';
import { requestLoggingMiddleware } from '../middleware/request-logging.middleware';

// Monitoring
import { getMetrics, getMetricsContentType } from '../core/monitoring';

// API Documentation
import { swaggerSpec, swaggerAccessControl, isSwaggerEnabled, swaggerUiOptions } from '../docs';

/**
 * Initialize all Express middleware
 */
export function initializeMiddleware(app: Express): void {
    // Security headers first
    app.use(securityHeadersMiddleware);

    // Request ID for tracing
    app.use(requestIdMiddleware);

    // Compression (before other middleware)
    app.use(compressionMiddleware);

    // CORS
    app.use(cors());

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    app.use(requestLoggingMiddleware);

    // Global rate limiting
    app.use(defaultRateLimiter);

    // Default timeout
    app.use(defaultTimeout);

    // Prometheus metrics middleware
    app.use(metricsMiddleware);

    // Metrics endpoint for Prometheus scraping
    app.get('/metrics', async (_req, res) => {
        try {
            const metrics = await getMetrics();
            res.set('Content-Type', getMetricsContentType());
            res.send(metrics);
        } catch (error) {
            console.error('[METRICS] Error collecting metrics:', error);
            res.status(500).send('Error collecting metrics');
        }
    });

    // API Documentation (disabled in production)
    if (isSwaggerEnabled()) {
        app.use(
            '/api-docs',
            swaggerAccessControl(),
            swaggerUi.serve,
            swaggerUi.setup(swaggerSpec, swaggerUiOptions)
        );

        // JSON spec endpoint (development only)
        if (process.env.NODE_ENV === 'development') {
            app.get('/api-docs.json', swaggerAccessControl(), (_req, res) => {
                res.json(swaggerSpec);
            });
        }

        console.log('[SWAGGER] API documentation available at /api-docs');
    }
}
