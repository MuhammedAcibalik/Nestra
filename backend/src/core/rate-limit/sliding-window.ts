/**
 * Sliding Window Rate Limiter
 * More accurate than fixed window, prevents boundary attacks
 * Uses sorted sets to track request timestamps
 */

import { IRateLimiter, IRateLimitResult, ISlidingWindowConfig, IRateLimitStorage } from './types';
import { createModuleLogger } from '../logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createModuleLogger('SlidingWindowLimiter');

export class SlidingWindowLimiter implements IRateLimiter {
    constructor(
        private readonly storage: IRateLimitStorage,
        private readonly config: ISlidingWindowConfig
    ) {}

    async consume(key: string, tokens = 1): Promise<IRateLimitResult> {
        const windowKey = `sw:${key}`;
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Remove expired entries
        await this.storage.zremrangebyscore(windowKey, 0, windowStart);

        // Count current requests in window
        const currentCount = await this.storage.zcount(windowKey, windowStart, now);

        if (currentCount + tokens <= this.config.maxRequests) {
            // Add new request(s)
            for (let i = 0; i < tokens; i++) {
                await this.storage.zadd(windowKey, now, `${now}:${uuidv4()}`);
            }

            return {
                allowed: true,
                remaining: this.config.maxRequests - currentCount - tokens,
                resetAt: new Date(now + this.config.windowMs)
            };
        }

        // Rate limited
        const retryAfter = Math.ceil(this.config.windowMs / 1000);

        logger.debug('Sliding window limit exceeded', {
            key,
            currentCount,
            maxRequests: this.config.maxRequests
        });

        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(now + this.config.windowMs),
            retryAfter
        };
    }

    async check(key: string): Promise<IRateLimitResult> {
        const windowKey = `sw:${key}`;
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Count current requests in window
        const currentCount = await this.storage.zcount(windowKey, windowStart, now);

        return {
            allowed: currentCount < this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - currentCount),
            resetAt: new Date(now + this.config.windowMs)
        };
    }

    async reset(key: string): Promise<void> {
        await this.storage.del(`sw:${key}`);
    }
}

/**
 * Fixed Window Rate Limiter
 * Simple counter-based approach, less memory than sliding window
 */
export class FixedWindowLimiter implements IRateLimiter {
    constructor(
        private readonly storage: IRateLimitStorage,
        private readonly config: ISlidingWindowConfig
    ) {}

    async consume(key: string, tokens = 1): Promise<IRateLimitResult> {
        const now = Date.now();
        const windowId = Math.floor(now / this.config.windowMs);
        const windowKey = `fw:${key}:${windowId}`;
        const windowEnd = (windowId + 1) * this.config.windowMs;

        // Increment counter
        const count = await this.storage.incr(windowKey, this.config.windowMs);

        if (count <= this.config.maxRequests) {
            return {
                allowed: true,
                remaining: this.config.maxRequests - count,
                resetAt: new Date(windowEnd)
            };
        }

        // Rate limited
        const retryAfter = Math.ceil((windowEnd - now) / 1000);

        logger.debug('Fixed window limit exceeded', { key, count, maxRequests: this.config.maxRequests });

        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(windowEnd),
            retryAfter
        };
    }

    async check(key: string): Promise<IRateLimitResult> {
        const now = Date.now();
        const windowId = Math.floor(now / this.config.windowMs);
        const windowKey = `fw:${key}:${windowId}`;
        const windowEnd = (windowId + 1) * this.config.windowMs;

        const count = (await this.storage.get(windowKey)) ?? 0;

        return {
            allowed: count < this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - count),
            resetAt: new Date(windowEnd)
        };
    }

    async reset(key: string): Promise<void> {
        const now = Date.now();
        const windowId = Math.floor(now / this.config.windowMs);
        await this.storage.del(`fw:${key}:${windowId}`);
    }
}
