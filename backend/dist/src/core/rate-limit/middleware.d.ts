/**
 * Rate Limiting Middleware
 * Express middleware for applying rate limits to routes
 */
import { Request, Response, NextFunction } from 'express';
import { IRateLimitConfig, IRateLimitStorage } from './types';
export interface IRateLimitMiddlewareOptions {
    config?: Partial<IRateLimitConfig>;
    storage?: IRateLimitStorage;
}
/**
 * Create rate limiting middleware
 */
export declare function createRateLimitMiddleware(options?: IRateLimitMiddlewareOptions): Promise<(req: Request, res: Response, next: NextFunction) => void>;
/**
 * Simple rate limit function for programmatic use
 */
export declare function rateLimitCheck(key: string, maxRequests: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
}>;
//# sourceMappingURL=middleware.d.ts.map