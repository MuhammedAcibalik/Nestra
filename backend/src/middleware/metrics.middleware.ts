/**
 * Metrics Middleware
 * HTTP request/response metrics collection
 * Following Microservice Pattern: Observability
 */

import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration, httpActiveRequests } from '../core/monitoring';

/**
 * HTTP Metrics Middleware
 * Records request count, duration, and active connections
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    // Increment active requests
    httpActiveRequests.inc();

    // Get route pattern (use path as fallback)
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;

    // On response finish
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationSeconds = Number(end - start) / 1e9;
        const statusCode = res.statusCode.toString();

        // Record metrics
        httpRequestsTotal.labels(method, route, statusCode).inc();
        httpRequestDuration.labels(method, route, statusCode).observe(durationSeconds);
        httpActiveRequests.dec();
    });

    next();
}
