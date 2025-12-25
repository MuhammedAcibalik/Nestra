/**
 * Rate Limiter Interfaces and Types
 * Supporting multiple algorithms: Token Bucket, Sliding Window, Fixed Window
 */

// ==================== CORE INTERFACES ====================

export interface IRateLimitResult {
    readonly allowed: boolean;
    readonly remaining: number;
    readonly resetAt: Date;
    readonly retryAfter?: number; // seconds
}

export interface IRateLimiter {
    /**
     * Check if request is allowed and consume token if so
     */
    consume(key: string, tokens?: number): Promise<IRateLimitResult>;

    /**
     * Check remaining tokens without consuming
     */
    check(key: string): Promise<IRateLimitResult>;

    /**
     * Reset limit for a key
     */
    reset(key: string): Promise<void>;
}

// ==================== CONFIGURATION ====================

export interface ITokenBucketConfig {
    /** Maximum tokens in bucket */
    capacity: number;
    /** Tokens added per interval */
    refillRate: number;
    /** Refill interval in milliseconds */
    refillInterval: number;
}

export interface ISlidingWindowConfig {
    /** Window size in milliseconds */
    windowMs: number;
    /** Maximum requests per window */
    maxRequests: number;
}

export interface IFixedWindowConfig {
    /** Window size in milliseconds */
    windowMs: number;
    /** Maximum requests per window */
    maxRequests: number;
}

// ==================== ROUTE CONFIG ====================

export type RateLimitAlgorithm = 'token-bucket' | 'sliding-window' | 'fixed-window';

export interface IEndpointRateLimit {
    /** Rate limiting algorithm */
    algorithm: RateLimitAlgorithm;
    /** Configuration for the algorithm */
    config: ITokenBucketConfig | ISlidingWindowConfig | IFixedWindowConfig;
    /** Skip rate limiting for certain conditions */
    skip?: (req: unknown) => boolean;
    /** Custom key generator (default: IP + userId) */
    keyGenerator?: (req: unknown) => string;
    /** Custom error message */
    message?: string;
}

export interface IRateLimitConfig {
    /** Enable/disable rate limiting globally */
    enabled: boolean;

    /** Default algorithm for unspecified endpoints */
    defaultAlgorithm: RateLimitAlgorithm;

    /** Per-user global limits (token bucket) */
    user: ITokenBucketConfig;

    /** Per-endpoint limits */
    endpoints: Record<string, IEndpointRateLimit>;

    /** Tenant-level daily limits (optional) */
    tenant?: {
        requestsPerDay: number;
    };

    /** Redis connection string (required for distributed) */
    redisUrl?: string;

    /** Use in-memory fallback if Redis unavailable */
    fallbackToMemory: boolean;

    /** Whitelist IPs/users */
    whitelist?: {
        ips?: string[];
        userIds?: string[];
    };
}

// ==================== DEFAULT CONFIG ====================

export const defaultRateLimitConfig: IRateLimitConfig = {
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

// ==================== STORAGE INTERFACE ====================

export interface IRateLimitStorage {
    /**
     * Get current value for key
     */
    get(key: string): Promise<number | null>;

    /**
     * Set value with expiry
     */
    set(key: string, value: number, ttlMs: number): Promise<void>;

    /**
     * Increment value atomically
     */
    incr(key: string, ttlMs: number): Promise<number>;

    /**
     * Add to sorted set (for sliding window)
     */
    zadd(key: string, score: number, member: string): Promise<void>;

    /**
     * Remove expired entries from sorted set
     */
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;

    /**
     * Count entries in sorted set range
     */
    zcount(key: string, min: number, max: number): Promise<number>;

    /**
     * Delete key
     */
    del(key: string): Promise<void>;

    /**
     * Check if connected
     */
    isConnected(): boolean;
}
