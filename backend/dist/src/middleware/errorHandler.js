"use strict";
/**
 * Enhanced Error Handler Middleware
 * Following Single Responsibility Principle (SRP)
 * Centralized error handling with Sentry integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = void 0;
exports.errorHandler = errorHandler;
exports.createError = createError;
exports.createValidationError = createValidationError;
exports.createNotFoundError = createNotFoundError;
exports.createAuthenticationError = createAuthenticationError;
exports.createAuthorizationError = createAuthorizationError;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
const logger_1 = require("../core/logger");
const error_tracking_1 = require("../core/error-tracking");
const logger = (0, logger_1.createModuleLogger)('ErrorHandler');
// ==================== ERROR CODES ====================
exports.ErrorCodes = {
    VALIDATION: { code: 'VALIDATION_ERROR', status: 400 },
    AUTHENTICATION: { code: 'AUTHENTICATION_ERROR', status: 401 },
    AUTHORIZATION: { code: 'AUTHORIZATION_ERROR', status: 403 },
    NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
    CONFLICT: { code: 'CONFLICT', status: 409 },
    RATE_LIMIT: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
    INTERNAL: { code: 'INTERNAL_ERROR', status: 500 },
    EXTERNAL_SERVICE: { code: 'EXTERNAL_SERVICE_ERROR', status: 502 },
    DATABASE: { code: 'DATABASE_ERROR', status: 503 }
};
// ==================== ERROR HANDLER ====================
function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'Internal Server Error';
    const isOperational = err.isOperational ?? statusCode < 500;
    // Get request context for logging
    const authReq = req;
    const requestContext = {
        requestId: req.headers['x-request-id'],
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
            (0, error_tracking_1.captureException)(err, {
                code: errorCode,
                ...requestContext
            });
        }
    }
    else {
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
function createError(message, statusCode = 500, code) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    return error;
}
function createValidationError(message, details) {
    const error = new Error(message);
    error.statusCode = exports.ErrorCodes.VALIDATION.status;
    error.code = exports.ErrorCodes.VALIDATION.code;
    error.isOperational = true;
    error.details = details;
    return error;
}
function createNotFoundError(resource) {
    const error = new Error(`${resource} not found`);
    error.statusCode = exports.ErrorCodes.NOT_FOUND.status;
    error.code = exports.ErrorCodes.NOT_FOUND.code;
    error.isOperational = true;
    return error;
}
function createAuthenticationError(message = 'Authentication required') {
    const error = new Error(message);
    error.statusCode = exports.ErrorCodes.AUTHENTICATION.status;
    error.code = exports.ErrorCodes.AUTHENTICATION.code;
    error.isOperational = true;
    return error;
}
function createAuthorizationError(message = 'Access denied') {
    const error = new Error(message);
    error.statusCode = exports.ErrorCodes.AUTHORIZATION.status;
    error.code = exports.ErrorCodes.AUTHORIZATION.code;
    error.isOperational = true;
    return error;
}
// ==================== ASYNC HANDLER ====================
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// ==================== 404 HANDLER ====================
function notFoundHandler(req, _res, next) {
    next(createNotFoundError(`Route ${req.method} ${req.path}`));
}
//# sourceMappingURL=errorHandler.js.map