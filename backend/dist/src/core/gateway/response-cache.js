"use strict";
/**
 * Response Cache Layer
 * Caches GET responses for improved performance
 * Following Cache-Aside Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCache = void 0;
exports.getResponseCache = getResponseCache;
exports.responseCacheMiddleware = responseCacheMiddleware;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('ResponseCache');
// ==================== RESPONSE CACHE ====================
class ResponseCache {
    cache = new Map();
    config;
    constructor(config) {
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
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
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
    set(key, data, statusCode, headers, ttl) {
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
    invalidate(pattern) {
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
    clear() {
        this.cache.clear();
        logger.info('Cache cleared');
    }
    /**
     * Get cache stats
     */
    getStats() {
        return {
            entries: this.cache.size,
            maxEntries: this.config.maxEntries
        };
    }
    /**
     * Cleanup expired entries
     */
    cleanup() {
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
    evictOldest() {
        let oldestKey = null;
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
    shouldCache(req) {
        // Only cache GET requests
        if (req.method !== 'GET')
            return null;
        // Skip authenticated if configured
        if (this.config.skipAuthenticated && req.user) {
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
    generateKey(req, pathConfig) {
        if (pathConfig?.keyGenerator) {
            return pathConfig.keyGenerator(req);
        }
        // Default: path + query params
        const queryStr = Object.keys(req.query).length > 0
            ? `?${new URLSearchParams(req.query).toString()}`
            : '';
        return `${req.path}${queryStr}`;
    }
}
exports.ResponseCache = ResponseCache;
// ==================== MIDDLEWARE ====================
let cacheInstance = null;
function getResponseCache(config) {
    cacheInstance ??= new ResponseCache(config);
    return cacheInstance;
}
/**
 * Response caching middleware
 */
function responseCacheMiddleware(config) {
    const cache = getResponseCache(config);
    return (req, res, next) => {
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
        res.json = function (data) {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const headers = {};
                const contentType = res.getHeader('Content-Type');
                if (contentType)
                    headers['Content-Type'] = String(contentType);
                cache.set(cacheKey, data, res.statusCode, headers, pathConfig.ttl);
            }
            return originalJson(data);
        };
        next();
    };
}
// ==================== HELPERS ====================
function matchPath(path, pattern) {
    if (pattern === '*')
        return true;
    if (pattern.endsWith('*')) {
        return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
}
//# sourceMappingURL=response-cache.js.map