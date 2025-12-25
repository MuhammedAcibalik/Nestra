/**
 * Enhanced Error Handler Middleware
 * Following Single Responsibility Principle (SRP)
 * Centralized error handling with Sentry integration
 */

import { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../core/logger';
import { captureException } from '../core/error-tracking';

const logger = createModuleLogger('ErrorHandler');

// ==================== ERROR TYPES ====================

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
    details?: Record<string, unknown>;
}

export type ErrorCategory =
    | 'VALIDATION'
    | 'AUTHENTICATION'
    | 'AUTHORIZATION'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMIT'
    | 'INTERNAL'
    | 'EXTERNAL_SERVICE'
    | 'DATABASE';

// ==================== ERROR CODES ====================

export const ErrorCodes = {
    VALIDATION: { code: 'VALIDATION_ERROR', status: 400 },
    AUTHENTICATION: { code: 'AUTHENTICATION_ERROR', status: 401 },
    AUTHORIZATION: { code: 'AUTHORIZATION_ERROR', status: 403 },
    NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
    CONFLICT: { code: 'CONFLICT', status: 409 },
    RATE_LIMIT: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
    INTERNAL: { code: 'INTERNAL_ERROR', status: 500 },
    EXTERNAL_SERVICE: { code: 'EXTERNAL_SERVICE_ERROR', status: 502 },
    DATABASE: { code: 'DATABASE_ERROR', status: 503 }
} as const;

// ==================== ERROR HANDLER ====================

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'Internal Server Error';
    const isOperational = err.isOperational ?? statusCode < 500;

    // Get request context for logging
    const authReq = req as Request & { user?: { userId?: string } };
    const requestContext = {
        requestId: req.headers['x-request-id'] as string | undefined,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: authReq.user?.userId
    };

    // Log error with context
    if (statusCode >= 500) {
        logger.error('Server error occurred', {
            error: message,
            code: errorCode,
            stack: err.stack,
            ...requestContext
        });

        // Capture non-operational errors in Sentry
        if (!isOperational) {
            captureException(err, {
                code: errorCode,
                ...requestContext
            });
        }
    } else {
        logger.warn('Client error occurred', {
            error: message,
            code: errorCode,
            ...requestContext
        });
    }

    // Send response
    res.status(statusCode).json({
        success: false,
        error: {
            code: errorCode,
            message,
            ...(err.details && { details: err.details }),
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        },
        requestId: requestContext.requestId
    });
}

// ==================== ERROR FACTORIES ====================

export function createError(message: string, statusCode: number = 500, code?: string): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
}

export function createValidationError(message: string, details?: Record<string, unknown>): AppError {
    const error: AppError = new Error(message);
    error.statusCode = ErrorCodes.VALIDATION.status;
    error.code = ErrorCodes.VALIDATION.code;
    error.isOperational = true;
    error.details = details;
    return error;
}

export function createNotFoundError(resource: string): AppError {
    const error: AppError = new Error(`${resource} not found`);
    error.statusCode = ErrorCodes.NOT_FOUND.status;
    error.code = ErrorCodes.NOT_FOUND.code;
    error.isOperational = true;
    return error;
}

export function createAuthenticationError(message: string = 'Authentication required'): AppError {
    const error: AppError = new Error(message);
    error.statusCode = ErrorCodes.AUTHENTICATION.status;
    error.code = ErrorCodes.AUTHENTICATION.code;
    error.isOperational = true;
    return error;
}

export function createAuthorizationError(message: string = 'Access denied'): AppError {
    const error: AppError = new Error(message);
    error.statusCode = ErrorCodes.AUTHORIZATION.status;
    error.code = ErrorCodes.AUTHORIZATION.code;
    error.isOperational = true;
    return error;
}

// ==================== ASYNC HANDLER ====================

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// ==================== 404 HANDLER ====================

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(createNotFoundError(`Route ${req.method} ${req.path}`));
}
