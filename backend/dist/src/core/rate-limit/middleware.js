"use strict";
/**
 * Rate Limiting Middleware
 * Express middleware for applying rate limits to routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRateLimitMiddleware = createRateLimitMiddleware;
exports.rateLimitCheck = rateLimitCheck;
const types_1 = require("./types");
const storage_1 = require("./storage");
const token_bucket_1 = require("./token-bucket");
const sliding_window_1 = require("./sliding-window");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('RateLimitMiddleware');
/**
 * Create rate limiting middleware
 */
async function createRateLimitMiddleware(options = {}) {
    const config = {
        ...types_1.defaultRateLimitConfig,
        ...options.config
    };
    if (!config.enabled) {
        return (_req, _res, next) => next();
    }
    // Get or create storage
    const storage = options.storage ?? await (0, storage_1.getRateLimitStorage)(config.redisUrl);
    // Create limiters cache
    const limiters = new Map();
    function getLimiter(endpointConfig) {
        const key = JSON.stringify(endpointConfig);
        if (!limiters.has(key)) {
            switch (endpointConfig.algorithm) {
                case 'token-bucket':
                    limiters.set(key, new token_bucket_1.TokenBucketLimiter(storage, endpointConfig.config));
                    break;
                case 'sliding-window':
                    limiters.set(key, new sliding_window_1.SlidingWindowLimiter(storage, endpointConfig.config));
                    break;
                case 'fixed-window':
                    limiters.set(key, new sliding_window_1.FixedWindowLimiter(storage, endpointConfig.config));
                    break;
            }
        }
        return limiters.get(key);
    }
    return (req, res, next) => {
        void (async () => {
            const authReq = req;
            // Check whitelist
            if (isWhitelisted(req, config)) {
                return next();
            }
            // Find matching endpoint config
            const endpointConfig = findEndpointConfig(req, config);
            if (!endpointConfig) {
                return next();
            }
            // Check skip condition
            if (endpointConfig.skip?.(req)) {
                return next();
            }
            // Generate key
            const key = endpointConfig.keyGenerator
                ? endpointConfig.keyGenerator(req)
                : generateKey(req, authReq.user?.id);
            // Get limiter and check
            const limiter = getLimiter(endpointConfig);
            const result = await limiter.consume(key);
            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', getLimit(endpointConfig));
            res.setHeader('X-RateLimit-Remaining', result.remaining);
            res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000));
            if (!result.allowed) {
                res.setHeader('Retry-After', result.retryAfter ?? 60);
                logger.warn('Rate limit exceeded', {
                    key,
                    ip: req.ip,
                    userId: authReq.user?.id,
                    path: req.path,
                    method: req.method
                });
                return res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: endpointConfig.message ?? 'Too many requests. Please try again later.',
                        retryAfter: result.retryAfter
                    }
                });
            }
            next();
        })();
    };
}
// ==================== HELPER FUNCTIONS ====================
function isWhitelisted(req, config) {
    const authReq = req;
    if (config.whitelist?.ips?.includes(req.ip ?? '')) {
        return true;
    }
    if (authReq.user?.id && config.whitelist?.userIds?.includes(authReq.user.id)) {
        return true;
    }
    return false;
}
function findEndpointConfig(req, config) {
    const methodPath = `${req.method} ${req.path}`;
    // Check specific patterns first
    for (const [pattern, endpointConfig] of Object.entries(config.endpoints)) {
        if (matchPattern(methodPath, pattern)) {
            return endpointConfig;
        }
    }
    return null;
}
function matchPattern(methodPath, pattern) {
    // Convert wildcard pattern to regex
    const escapedPattern = pattern
        .replaceAll('*', '[^/]+')
        .replaceAll('/', String.raw `\/`);
    const regex = new RegExp(`^${escapedPattern}$`);
    return regex.test(methodPath);
}
function generateKey(req, userId) {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    if (userId) {
        return `user:${userId}`;
    }
    return `ip:${ip}`;
}
function getLimit(config) {
    if ('maxRequests' in config.config) {
        return config.config.maxRequests;
    }
    if ('capacity' in config.config) {
        return config.config.capacity;
    }
    return 0;
}
// ==================== SIMPLE RATE LIMIT DECORATOR ====================
/**
 * Simple rate limit function for programmatic use
 */
async function rateLimitCheck(key, maxRequests, windowMs) {
    const storage = await (0, storage_1.getRateLimitStorage)();
    const limiter = new sliding_window_1.SlidingWindowLimiter(storage, { windowMs, maxRequests });
    const result = await limiter.check(key);
    return { allowed: result.allowed, remaining: result.remaining };
}
//# sourceMappingURL=middleware.js.map