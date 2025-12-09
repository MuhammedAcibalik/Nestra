"use strict";
/**
 * Request Logging Middleware
 * Logs all incoming requests with timing and response info
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
exports.requestLoggingMiddleware = requestLoggingMiddleware;
exports.auditLog = auditLog;
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
/**
 * Request ID middleware - adds unique ID to each request
 */
function requestIdMiddleware(req, _res, next) {
    // Use existing X-Request-ID header or generate new one
    const requestId = req.headers['x-request-id'] ?? (0, uuid_1.v4)();
    req.requestId = requestId;
    // Create request-scoped logger
    const userId = req.user?.id;
    req.log = (0, logger_1.createRequestLogger)(requestId, userId);
    next();
}
/**
 * Request logging middleware - logs request/response details
 */
function requestLoggingMiddleware(req, res, next) {
    const startTime = Date.now();
    // Log request start
    const requestData = {
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
    logger_1.logger.debug('Incoming request', requestData);
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
            logger_1.logger.error('Request failed', undefined, responseData);
        }
        else if (res.statusCode >= 400) {
            logger_1.logger.warn('Request error', responseData);
        }
        else {
            logger_1.logger.info('Request completed', responseData);
        }
    });
    next();
}
/**
 * Sanitize request body to remove sensitive data
 */
function sanitizeBody(body) {
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeBody(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
/**
 * Audit logging for important actions
 */
function auditLog(action, userId, resourceType, resourceId, details) {
    logger_1.logger.info('AUDIT', {
        action,
        userId,
        resourceType,
        resourceId,
        details,
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=request-logger.js.map