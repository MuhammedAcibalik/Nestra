"use strict";
/**
 * Metrics Middleware
 * HTTP request/response metrics collection
 * Following Microservice Pattern: Observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsMiddleware = metricsMiddleware;
const monitoring_1 = require("../core/monitoring");
/**
 * HTTP Metrics Middleware
 * Records request count, duration, and active connections
 */
function metricsMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    // Increment active requests
    monitoring_1.httpActiveRequests.inc();
    // Get route pattern (use path as fallback)
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    // On response finish
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationSeconds = Number(end - start) / 1e9;
        const statusCode = res.statusCode.toString();
        // Record metrics
        monitoring_1.httpRequestsTotal.labels(method, route, statusCode).inc();
        monitoring_1.httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
        monitoring_1.httpActiveRequests.dec();
    });
    next();
}
//# sourceMappingURL=metrics.middleware.js.map