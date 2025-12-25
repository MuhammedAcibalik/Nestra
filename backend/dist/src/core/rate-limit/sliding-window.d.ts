/**
 * Sliding Window Rate Limiter
 * More accurate than fixed window, prevents boundary attacks
 * Uses sorted sets to track request timestamps
 */
import { IRateLimiter, IRateLimitResult, ISlidingWindowConfig, IRateLimitStorage } from './types';
export declare class SlidingWindowLimiter implements IRateLimiter {
    private readonly storage;
    private readonly config;
    constructor(storage: IRateLimitStorage, config: ISlidingWindowConfig);
    consume(key: string, tokens?: number): Promise<IRateLimitResult>;
    check(key: string): Promise<IRateLimitResult>;
    reset(key: string): Promise<void>;
}
/**
 * Fixed Window Rate Limiter
 * Simple counter-based approach, less memory than sliding window
 */
export declare class FixedWindowLimiter implements IRateLimiter {
    private readonly storage;
    private readonly config;
    constructor(storage: IRateLimitStorage, config: ISlidingWindowConfig);
    consume(key: string, tokens?: number): Promise<IRateLimitResult>;
    check(key: string): Promise<IRateLimitResult>;
    reset(key: string): Promise<void>;
}
//# sourceMappingURL=sliding-window.d.ts.map