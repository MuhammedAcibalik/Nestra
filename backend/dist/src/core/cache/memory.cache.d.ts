/**
 * In-Memory Cache Implementation
 * Fallback when Redis is not available
 * Following Single Responsibility Principle (SRP)
 */
import { ICacheClient } from './cache.interface';
/**
 * In-Memory Cache Client
 * Simple Map-based cache for development/fallback
 */
export declare class MemoryCache implements ICacheClient {
    private readonly cache;
    private cleanupInterval;
    constructor();
    private cleanup;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Cache-aside pattern: Get from cache or compute and cache
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Get multiple values at once
     */
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Set multiple values at once
     */
    mset<T>(entries: Array<{
        key: string;
        value: T;
        ttl?: number;
    }>): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<number>;
    exists(key: string): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    isConnected(): boolean;
    disconnect(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        keys: string[];
    };
}
//# sourceMappingURL=memory.cache.d.ts.map