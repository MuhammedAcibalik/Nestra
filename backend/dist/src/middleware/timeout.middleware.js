"use strict";
/**
 * Timeout Middleware
 * Prevents long-running requests from blocking resources
 * Following Microservice Pattern: Fail-Fast, Resource Management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutConfig = exports.uploadTimeout = exports.optimizationTimeout = exports.defaultTimeout = void 0;
exports.createTimeoutMiddleware = createTimeoutMiddleware;
const timeoutConfig = {
    defaultTimeoutMs: 30000, // 30 seconds
    optimizationTimeoutMs: 120000, // 2 minutes for CPU-intensive
    uploadTimeoutMs: 300000 // 5 minutes for uploads
};
exports.timeoutConfig = timeoutConfig;
// ==================== MIDDLEWARE ====================
/**
 * Creates timeout middleware with configurable duration
 */
function createTimeoutMiddleware(timeoutMs = timeoutConfig.defaultTimeoutMs) {
    return (req, res, next) => {
        // Set timeout on the request
        req.setTimeout(timeoutMs);
        // Create timeout handler
        const timeoutId = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    error: 'Request Timeout',
                    message: `Request exceeded ${timeoutMs}ms timeout`,
                    requestId: req.requestId
                });
            }
        }, timeoutMs);
        // Clear timeout when response finishes
        res.on('finish', () => clearTimeout(timeoutId));
        res.on('close', () => clearTimeout(timeoutId));
        next();
    };
}
// ==================== PRE-CONFIGURED MIDDLEWARE ====================
exports.defaultTimeout = createTimeoutMiddleware(timeoutConfig.defaultTimeoutMs);
exports.optimizationTimeout = createTimeoutMiddleware(timeoutConfig.optimizationTimeoutMs);
exports.uploadTimeout = createTimeoutMiddleware(timeoutConfig.uploadTimeoutMs);
//# sourceMappingURL=timeout.middleware.js.map