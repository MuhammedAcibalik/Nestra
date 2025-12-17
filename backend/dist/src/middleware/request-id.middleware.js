"use strict";
/**
 * Request ID Middleware
 * Adds unique request ID for tracing and logging
 * Following Microservice Pattern: Distributed Tracing, Correlation ID
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
exports.getRequestId = getRequestId;
const node_crypto_1 = require("node:crypto");
/**
 * Request ID Middleware
 * Adds or uses existing X-Request-ID header for request tracing
 */
function requestIdMiddleware(req, res, next) {
    // Use existing header or generate new UUID
    const requestId = req.headers['x-request-id'] ?? (0, node_crypto_1.randomUUID)();
    // Attach to request object
    req.requestId = requestId;
    // Add to response headers for client tracking
    res.setHeader('X-Request-ID', requestId);
    next();
}
/**
 * Get request ID from request object
 */
function getRequestId(req) {
    return req.requestId ?? 'unknown';
}
//# sourceMappingURL=request-id.middleware.js.map