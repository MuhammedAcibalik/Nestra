/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 * Following Microservice Pattern: API Gateway, Defense in Depth
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// ==================== RATE LIMIT CONFIGS ====================

/**
 * Default rate limiter - General API endpoints
 * 100 requests per 15 minutes per IP
 */
export const defaultRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 15 * 60 // seconds
    },
    handler: (_req: Request, res: Response) => {
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
export const authRateLimiter = rateLimit({
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
export const apiRateLimiter = rateLimit({
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
export const optimizationRateLimiter = rateLimit({
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
export const uploadRateLimiter = rateLimit({
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
