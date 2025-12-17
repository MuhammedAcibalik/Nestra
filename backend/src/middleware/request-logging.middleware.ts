/**
 * Request Logging Middleware
 * Structured logging for all HTTP requests
 * Following Microservice Pattern: Observability, Distributed Tracing
 */

import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../core/logger';

const logger = getLogger();

/**
 * Request logging middleware
 * Logs request start and completion with duration
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();

    // Log request start
    logger.request('info', 'Request started', req);

    // On response finish, log completion
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        logger.requestComplete(req, res.statusCode, Math.round(durationMs));
    });

    next();
}
