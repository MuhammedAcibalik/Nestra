/**
 * Response Cache Layer
 * Caches GET responses for improved performance
 * Following Cache-Aside Pattern
 */

import { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('ResponseCache');

// ==================== INTERFACES ====================

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

// ==================== RESPONSE CACHE ====================

export class ResponseCache {
    private readonly cache: Map<string, ICacheEntry> = new Map();
    private readonly config: ICacheConfig;

    constructor(config?: Partial<ICacheConfig>) {
        this.config = {
            defaultTtl: config?.defaultTtl ?? 60,
            maxEntries: config?.maxEntries ?? 1000,
            cachePaths: config?.cachePaths ?? [],
            skipAuthenticated: config?.skipAuthenticated ?? true
        };

        // Cleanup expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }

    /**
     * Get cached response
     */
    get(key: string): ICacheEntry | null {
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if expired
        if (Date.now() > entry.cachedAt + entry.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }

        return entry;
    }

    /**
     * Set cached response
     */
    set(key: string, data: unknown, statusCode: number, headers: Record<string, string>, ttl?: number): void {
        // Enforce max entries
        if (this.cache.size >= this.config.maxEntries) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            statusCode,
            headers,
            cachedAt: Date.now(),
            ttl: ttl ?? this.config.defaultTtl
        });

        logger.debug('Response cached', { key, ttl: ttl ?? this.config.defaultTtl });
    }

    /**
     * Invalidate cache by key pattern
     */
    invalidate(pattern: string): number {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(pattern) || key.includes(pattern)) {
                this.cache.delete(key);
                count++;
            }
        }
        logger.debug('Cache invalidated', { pattern, count });
        return count;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        logger.info('Cache cleared');
    }

    /**
     * Get cache stats
     */
    getStats(): { entries: number; maxEntries: number } {
        return {
            entries: this.cache.size,
            maxEntries: this.config.maxEntries
        };
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.cachedAt + entry.ttl * 1000) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Cache cleanup', { cleaned });
        }
    }

    /**
     * Evict oldest entry
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.cachedAt < oldestTime) {
                oldestTime = entry.cachedAt;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }

    /**
     * Check if path should be cached
     */
    shouldCache(req: Request): ICachePathConfig | null {
        // Only cache GET requests
        if (req.method !== 'GET') return null;

        // Skip authenticated if configured
        if (this.config.skipAuthenticated && (req as Request & { user?: unknown }).user) {
            return null;
        }

        for (const pathConfig of this.config.cachePaths) {
            if (matchPath(req.path, pathConfig.path)) {
                if (!pathConfig.methods || pathConfig.methods.includes(req.method)) {
                    return pathConfig;
                }
            }
        }

        return null;
    }

    /**
     * Generate cache key
     */
    generateKey(req: Request, pathConfig?: ICachePathConfig): string {
        if (pathConfig?.keyGenerator) {
            return pathConfig.keyGenerator(req);
        }

        // Default: path + query params
        const queryStr =
            Object.keys(req.query).length > 0
                ? `?${new URLSearchParams(req.query as Record<string, string>).toString()}`
                : '';
        return `${req.path}${queryStr}`;
    }
}

// ==================== MIDDLEWARE ====================

let cacheInstance: ResponseCache | null = null;

export function getResponseCache(config?: Partial<ICacheConfig>): ResponseCache {
    cacheInstance ??= new ResponseCache(config);
    return cacheInstance;
}

/**
 * Response caching middleware
 */
export function responseCacheMiddleware(config?: Partial<ICacheConfig>) {
    const cache = getResponseCache(config);

    return (req: Request, res: Response, next: NextFunction): void => {
        const pathConfig = cache.shouldCache(req);

        if (!pathConfig) {
            next();
            return;
        }

        const cacheKey = cache.generateKey(req, pathConfig);
        const cached = cache.get(cacheKey);

        if (cached) {
            // Return cached response
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Age', String(Math.floor((Date.now() - cached.cachedAt) / 1000)));

            for (const [key, value] of Object.entries(cached.headers)) {
                res.setHeader(key, value);
            }

            res.status(cached.statusCode).json(cached.data);
            return;
        }

        // Capture response for caching
        res.setHeader('X-Cache', 'MISS');
        const originalJson = res.json.bind(res);

        res.json = function (data: unknown) {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const headers: Record<string, string> = {};
                const contentType = res.getHeader('Content-Type');
                if (contentType) headers['Content-Type'] = String(contentType);

                cache.set(cacheKey, data, res.statusCode, headers, pathConfig.ttl);
            }
            return originalJson(data);
        };

        next();
    };
}

// ==================== HELPERS ====================

function matchPath(path: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
        return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
}
