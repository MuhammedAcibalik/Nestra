/**
 * Response Cache Layer
 * Caches GET responses for improved performance
 * Following Cache-Aside Pattern
 */
import { Request, Response, NextFunction } from 'express';
export interface ICacheConfig {
    /** Default TTL in seconds */
    defaultTtl: number;
    /** Maximum cache entries */
    maxEntries: number;
    /** Paths to cache (supports wildcards) */
    cachePaths: ICachePathConfig[];
    /** Skip cache for authenticated requests */
    skipAuthenticated?: boolean;
}
export interface ICachePathConfig {
    path: string;
    ttl?: number;
    methods?: string[];
    /** Cache key generator */
    keyGenerator?: (req: Request) => string;
}
interface ICacheEntry {
    data: unknown;
    statusCode: number;
    headers: Record<string, string>;
    cachedAt: number;
    ttl: number;
}
export declare class ResponseCache {
    private readonly cache;
    private readonly config;
    constructor(config?: Partial<ICacheConfig>);
    /**
     * Get cached response
     */
    get(key: string): ICacheEntry | null;
    /**
     * Set cached response
     */
    set(key: string, data: unknown, statusCode: number, headers: Record<string, string>, ttl?: number): void;
    /**
     * Invalidate cache by key pattern
     */
    invalidate(pattern: string): number;
    /**
     * Clear all cache
     */
    clear(): void;
    /**
     * Get cache stats
     */
    getStats(): {
        entries: number;
        maxEntries: number;
    };
    /**
     * Cleanup expired entries
     */
    private cleanup;
    /**
     * Evict oldest entry
     */
    private evictOldest;
    /**
     * Check if path should be cached
     */
    shouldCache(req: Request): ICachePathConfig | null;
    /**
     * Generate cache key
     */
    generateKey(req: Request, pathConfig?: ICachePathConfig): string;
}
export declare function getResponseCache(config?: Partial<ICacheConfig>): ResponseCache;
/**
 * Response caching middleware
 */
export declare function responseCacheMiddleware(config?: Partial<ICacheConfig>): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=response-cache.d.ts.map