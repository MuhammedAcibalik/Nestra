/**
 * Cache Interface
 * Following Interface Segregation Principle (ISP)
 * Abstracts cache implementation for easy swapping
 */
export interface ICacheClient {
    /**
     * Get a value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set a value in cache with optional TTL (seconds)
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Get or set - Cache-aside pattern helper
     * If key exists, return cached value
     * If not, call factory function, cache result, and return
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Get multiple values (batch operation)
     */
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Set multiple values (batch operation)
     */
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    /**
     * Delete a key from cache
     */
    del(key: string): Promise<void>;
    /**
     * Delete multiple keys matching a pattern
     */
    delPattern(pattern: string): Promise<number>;
    /**
     * Check if key exists
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get TTL of a key in seconds (-1 if no TTL, -2 if not exists)
     */
    ttl(key: string): Promise<number>;
    /**
     * Increment a numeric value
     */
    incr(key: string): Promise<number>;
    /**
     * Set expiration on existing key
     */
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    /**
     * Get connection status
     */
    isConnected(): boolean;
    /**
     * Close connection
     */
    disconnect(): Promise<void>;
}
/**
 * Cache key prefixes for different domains
 */
export declare const CachePrefix: {
    readonly MATERIAL: "material:";
    readonly STOCK: "stock:";
    readonly ORDER: "order:";
    readonly OPTIMIZATION: "opt:";
    readonly SESSION: "session:";
    readonly RATE_LIMIT: "ratelimit:";
    readonly USER: "user:";
};
/**
 * Default TTL values (in seconds)
 */
export declare const CacheTTL: {
    readonly SHORT: 60;
    readonly MEDIUM: 300;
    readonly LONG: 3600;
    readonly SESSION: 86400;
    readonly MATERIAL_LIST: 3600;
    readonly STOCK_SUMMARY: 300;
    readonly OPTIMIZATION: 900;
};
//# sourceMappingURL=cache.interface.d.ts.map