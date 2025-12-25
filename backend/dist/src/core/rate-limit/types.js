"use strict";
/**
 * Rate Limiter Interfaces and Types
 * Supporting multiple algorithms: Token Bucket, Sliding Window, Fixed Window
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimitConfig = void 0;
// ==================== DEFAULT CONFIG ====================
exports.defaultRateLimitConfig = {
    enabled: true,
    defaultAlgorithm: 'sliding-window',
    fallbackToMemory: true,
    user: {
        capacity: 100,
        refillRate: 10,
        refillInterval: 1000 // 10 tokens per second
    },
    endpoints: {
        'POST /api/auth/login': {
            algorithm: 'sliding-window',
            config: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
            message: 'Too many login attempts. Please try again later.'
        },
        'POST /api/auth/register': {
            algorithm: 'sliding-window',
            config: { windowMs: 60 * 60 * 1000, maxRequests: 10 }
        },
        'POST /api/optimization/*/run': {
            algorithm: 'token-bucket',
            config: { capacity: 5, refillRate: 1, refillInterval: 60000 },
            message: 'Optimization rate limit reached. Please wait.'
        },
        'POST /api/*': {
            algorithm: 'sliding-window',
            config: { windowMs: 60000, maxRequests: 60 }
        },
        'GET /api/*': {
            algorithm: 'sliding-window',
            config: { windowMs: 60000, maxRequests: 200 }
        }
    }
};
//# sourceMappingURL=types.js.map