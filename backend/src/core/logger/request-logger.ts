/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and response info
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger, logger } from './logger';

// Extend Express Request to include request ID and logger
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            log: typeof logger;
        }
    }
}

// Interface for authenticated request with user
interface IAuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
        role?: string;
    };
}

// Interface for request data with optional body
interface IRequestData {
    [key: string]: unknown;
    method: string;
    url: string;
    ip: string | undefined;
    userAgent: string | string[] | undefined;
    contentLength: string | undefined;
    body?: Record<string, unknown>;
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void {
    // Use existing X-Request-ID header or generate new one
    const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
    req.requestId = requestId;

    // Create request-scoped logger
    const authReq = req as IAuthenticatedRequest;
    const userId = authReq.user?.id;
    req.log = createRequestLogger(requestId, userId) as typeof logger;

    next();
}

/**
 * Request logging middleware - logs request/response details
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Log request start
    const requestData: IRequestData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        contentLength: req.headers['content-length']
    };

    // For non-GET requests, log body (sanitized)
    if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = sanitizeBody(req.body);
        requestData.body = sanitizedBody;
    }

    logger.debug('Incoming request', requestData);

    // Hook into response finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const responseData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.getHeader('content-length')
        };

        // Choose log level based on status code
        if (res.statusCode >= 500) {
            logger.error('Request failed', undefined, responseData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request error', responseData);
        } else {
            logger.info('Request completed', responseData);
        }
    });

    next();
}

/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeBody(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Audit logging for important actions
 */
export function auditLog(
    action: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>
): void {
    logger.info('AUDIT', {
        action,
        userId,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString()
    });
}
