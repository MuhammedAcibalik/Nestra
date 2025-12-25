/**
 * Rate Limiting Middleware
 * Express middleware for applying rate limits to routes
 */

import { Request, Response, NextFunction } from 'express';
import {
    IRateLimiter,
    IRateLimitConfig,
    IEndpointRateLimit,
    ISlidingWindowConfig,
    ITokenBucketConfig,
    IRateLimitStorage,
    defaultRateLimitConfig
} from './types';
import { getRateLimitStorage } from './storage';
import { TokenBucketLimiter } from './token-bucket';
import { SlidingWindowLimiter, FixedWindowLimiter } from './sliding-window';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('RateLimitMiddleware');

// ==================== MIDDLEWARE FACTORY ====================

export interface IRateLimitMiddlewareOptions {
    config?: Partial<IRateLimitConfig>;
    storage?: IRateLimitStorage;
}

type IAuthenticatedRequest = Request & {
    user?: { id: string; tenantId?: string };
};

/**
 * Create rate limiting middleware
 */
export async function createRateLimitMiddleware(
    options: IRateLimitMiddlewareOptions = {}
): Promise<(req: Request, res: Response, next: NextFunction) => void> {
    const config: IRateLimitConfig = {
        ...defaultRateLimitConfig,
        ...options.config
    };

    if (!config.enabled) {
        return (_req, _res, next) => next();
    }

    // Get or create storage
    const storage = options.storage ?? (await getRateLimitStorage(config.redisUrl));

    // Create limiters cache
    const limiters: Map<string, IRateLimiter> = new Map();

    function getLimiter(endpointConfig: IEndpointRateLimit): IRateLimiter {
        const key = JSON.stringify(endpointConfig);

        if (!limiters.has(key)) {
            switch (endpointConfig.algorithm) {
                case 'token-bucket':
                    limiters.set(key, new TokenBucketLimiter(storage, endpointConfig.config as ITokenBucketConfig));
                    break;
                case 'sliding-window':
                    limiters.set(key, new SlidingWindowLimiter(storage, endpointConfig.config as ISlidingWindowConfig));
                    break;
                case 'fixed-window':
                    limiters.set(key, new FixedWindowLimiter(storage, endpointConfig.config as ISlidingWindowConfig));
                    break;
            }
        }

        return limiters.get(key)!;
    }

    return (req: Request, res: Response, next: NextFunction): void => {
        void (async () => {
            const authReq = req as IAuthenticatedRequest;

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

function isWhitelisted(req: Request, config: IRateLimitConfig): boolean {
    const authReq = req as IAuthenticatedRequest;

    if (config.whitelist?.ips?.includes(req.ip ?? '')) {
        return true;
    }

    if (authReq.user?.id && config.whitelist?.userIds?.includes(authReq.user.id)) {
        return true;
    }

    return false;
}

function findEndpointConfig(req: Request, config: IRateLimitConfig): IEndpointRateLimit | null {
    const methodPath = `${req.method} ${req.path}`;

    // Check specific patterns first
    for (const [pattern, endpointConfig] of Object.entries(config.endpoints)) {
        if (matchPattern(methodPath, pattern)) {
            return endpointConfig;
        }
    }

    return null;
}

function matchPattern(methodPath: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const escapedPattern = pattern.replaceAll('*', '[^/]+').replaceAll('/', String.raw`\/`);
    const regex = new RegExp(`^${escapedPattern}$`);

    return regex.test(methodPath);
}

function generateKey(req: Request, userId?: string): string {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';

    if (userId) {
        return `user:${userId}`;
    }

    return `ip:${ip}`;
}

function getLimit(config: IEndpointRateLimit): number {
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
export async function rateLimitCheck(
    key: string,
    maxRequests: number,
    windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
    const storage = await getRateLimitStorage();
    const limiter = new SlidingWindowLimiter(storage, { windowMs, maxRequests });
    const result = await limiter.check(key);
    return { allowed: result.allowed, remaining: result.remaining };
}
