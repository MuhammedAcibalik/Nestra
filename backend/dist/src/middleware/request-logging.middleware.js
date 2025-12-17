"use strict";
/**
 * Request Logging Middleware
 * Structured logging for all HTTP requests
 * Following Microservice Pattern: Observability, Distributed Tracing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoggingMiddleware = requestLoggingMiddleware;
const logger_1 = require("../core/logger");
const logger = (0, logger_1.getLogger)();
/**
 * Request logging middleware
 * Logs request start and completion with duration
 */
function requestLoggingMiddleware(req, res, next) {
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
//# sourceMappingURL=request-logging.middleware.js.map