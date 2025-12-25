"use strict";
/**
 * Express Middleware Configuration
 * Following Single Responsibility Principle (SRP)
 * Responsible for middleware setup only
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMiddleware = initializeMiddleware;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Middleware
const metrics_middleware_1 = require("../middleware/metrics.middleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const request_id_middleware_1 = require("../middleware/request-id.middleware");
const security_headers_middleware_1 = require("../middleware/security-headers.middleware");
const compression_middleware_1 = require("../middleware/compression.middleware");
const timeout_middleware_1 = require("../middleware/timeout.middleware");
const request_logging_middleware_1 = require("../middleware/request-logging.middleware");
// Monitoring
const monitoring_1 = require("../core/monitoring");
// API Documentation
const docs_1 = require("../docs");
/**
 * Initialize all Express middleware
 */
function initializeMiddleware(app) {
    // Security headers first
    app.use(security_headers_middleware_1.securityHeadersMiddleware);
    // Request ID for tracing
    app.use(request_id_middleware_1.requestIdMiddleware);
    // Compression (before other middleware)
    app.use(compression_middleware_1.compressionMiddleware);
    // CORS
    app.use((0, cors_1.default)());
    // Body parsing
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Request logging
    app.use(request_logging_middleware_1.requestLoggingMiddleware);
    // Global rate limiting
    app.use(rate_limit_middleware_1.defaultRateLimiter);
    // Default timeout
    app.use(timeout_middleware_1.defaultTimeout);
    // Prometheus metrics middleware
    app.use(metrics_middleware_1.metricsMiddleware);
    // Metrics endpoint for Prometheus scraping
    app.get('/metrics', async (_req, res) => {
        try {
            const metrics = await (0, monitoring_1.getMetrics)();
            res.set('Content-Type', (0, monitoring_1.getMetricsContentType)());
            res.send(metrics);
        }
        catch (error) {
            console.error('[METRICS] Error collecting metrics:', error);
            res.status(500).send('Error collecting metrics');
        }
    });
    // API Documentation (disabled in production)
    if ((0, docs_1.isSwaggerEnabled)()) {
        app.use('/api-docs', (0, docs_1.swaggerAccessControl)(), swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(docs_1.swaggerSpec, docs_1.swaggerUiOptions));
        // JSON spec endpoint (development only)
        if (process.env.NODE_ENV === 'development') {
            app.get('/api-docs.json', (0, docs_1.swaggerAccessControl)(), (_req, res) => {
                res.json(docs_1.swaggerSpec);
            });
        }
        console.log('[SWAGGER] API documentation available at /api-docs');
    }
}
//# sourceMappingURL=middleware.js.map