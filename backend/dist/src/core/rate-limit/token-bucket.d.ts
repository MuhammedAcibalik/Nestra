/**
 * Token Bucket Rate Limiter
 * Allows burst traffic up to bucket capacity
 * Tokens refill at a steady rate
 */
import { IRateLimiter, IRateLimitResult, ITokenBucketConfig, IRateLimitStorage } from './types';
export declare class TokenBucketLimiter implements IRateLimiter {
    private readonly storage;
    private readonly config;
    constructor(storage: IRateLimitStorage, config: ITokenBucketConfig);
    consume(key: string, tokens?: number): Promise<IRateLimitResult>;
    check(key: string): Promise<IRateLimitResult>;
    reset(key: string): Promise<void>;
    private refillBucket;
    private calculateResetTime;
    private calculateRetryAfter;
    private deserializeState;
    private saveState;
}
//# sourceMappingURL=token-bucket.d.ts.map