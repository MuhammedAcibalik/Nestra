"use strict";
/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 * Following Microservice Pattern: API Gateway, Defense in Depth
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsGenerationRateLimiter = exports.analyticsRateLimiter = exports.uploadRateLimiter = exports.optimizationRateLimiter = exports.apiRateLimiter = exports.authRateLimiter = exports.defaultRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ==================== RATE LIMIT CONFIGS ====================
/**
 * Default rate limiter - General API endpoints
 * 100 requests per 15 minutes per IP
 */
exports.defaultRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 15 * 60 // seconds
    },
    handler: (_req, res) => {
        res.status(429).json({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: 15 * 60
        });
    }
});
/**
 * Auth rate limiter - Login/Register endpoints
 * 10 requests per 15 minutes per IP (stricter for security)
 */
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication attempts',
        message: 'Please wait before trying again.',
        retryAfter: 15 * 60
    },
    skipSuccessfulRequests: false // Count all requests
});
/**
 * API rate limiter - General API with higher limit
 * 500 requests per 15 minutes per IP
 */
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    // Use default keyGenerator which handles IPv6 properly
    // express-rate-limit v7+ has built-in X-Forwarded-For support
    validate: {
        xForwardedForHeader: false // Disable validation warning
    }
});
/**
 * Optimization rate limiter - CPU intensive operations
 * 20 requests per 15 minutes per IP
 */
exports.optimizationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 optimization requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Optimization rate limit exceeded',
        message: 'Too many optimization requests. Please wait.',
        retryAfter: 15 * 60
    }
});
/**
 * Upload rate limiter - File upload endpoints
 * 50 requests per hour per IP
 */
exports.uploadRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Upload rate limit exceeded',
        message: 'Too many file uploads. Please try again later.',
        retryAfter: 60 * 60
    }
});
/**
 * Analytics rate limiter - Forecast/Reports endpoints
 * 60 requests per 15 minutes per IP (moderate - read operations)
 */
exports.analyticsRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // 60 analytics requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Analytics rate limit exceeded',
        message: 'Too many analytics requests. Results are cached, please wait.',
        retryAfter: 15 * 60
    }
});
/**
 * Analytics generation rate limiter - CPU intensive analytics operations
 * detect/generate endpoints - 10 requests per 15 minutes per IP
 */
exports.analyticsGenerationRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 generation requests per window (CPU intensive)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Analytics generation rate limit exceeded',
        message: 'Too many analytics generation requests. Please wait before running detection again.',
        retryAfter: 15 * 60
    }
});
//# sourceMappingURL=rate-limit.middleware.js.map