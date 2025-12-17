/**
 * Request ID Middleware
 * Adds unique request ID for tracing and logging
 * Following Microservice Pattern: Distributed Tracing, Correlation ID
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            requestId: string;
        }
    }
}

/**
 * Request ID Middleware
 * Adds or uses existing X-Request-ID header for request tracing
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Use existing header or generate new UUID
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();

    // Attach to request object
    req.requestId = requestId;

    // Add to response headers for client tracking
    res.setHeader('X-Request-ID', requestId);

    next();
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string {
    return req.requestId ?? 'unknown';
}
