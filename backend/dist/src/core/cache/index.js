"use strict";
/**
 * Cache Module - Barrel Export
 * Factory function for cache client creation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = exports.RedisCache = exports.CacheTTL = exports.CachePrefix = void 0;
exports.createCacheClient = createCacheClient;
exports.getCacheClient = getCacheClient;
exports.initializeCache = initializeCache;
exports.shutdownCache = shutdownCache;
exports.getCache = getCache;
const redis_cache_1 = require("./redis.cache");
const memory_cache_1 = require("./memory.cache");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('CacheFactory');
var cache_interface_1 = require("./cache.interface");
Object.defineProperty(exports, "CachePrefix", { enumerable: true, get: function () { return cache_interface_1.CachePrefix; } });
Object.defineProperty(exports, "CacheTTL", { enumerable: true, get: function () { return cache_interface_1.CacheTTL; } });
var redis_cache_2 = require("./redis.cache");
Object.defineProperty(exports, "RedisCache", { enumerable: true, get: function () { return redis_cache_2.RedisCache; } });
var memory_cache_2 = require("./memory.cache");
Object.defineProperty(exports, "MemoryCache", { enumerable: true, get: function () { return memory_cache_2.MemoryCache; } });
// Singleton cache instance
let cacheInstance = null;
/**
 * Get default cache configuration from environment
 */
function getDefaultConfig() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        try {
            const url = new URL(redisUrl);
            return {
                useRedis: true,
                redis: {
                    host: url.hostname,
                    port: Number.parseInt(url.port, 10) || 6379,
                    password: url.password || undefined,
                    db: url.pathname ? Number.parseInt(url.pathname.slice(1), 10) : 0
                }
            };
        }
        catch {
            logger.warn('Invalid REDIS_URL, falling back to in-memory cache');
        }
    }
    return {
        useRedis: process.env.USE_REDIS === 'true',
        redis: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
            password: process.env.REDIS_PASSWORD,
            db: Number.parseInt(process.env.REDIS_DB ?? '0', 10)
        }
    };
}
/**
 * Create cache client based on configuration
 */
async function createCacheClient(config) {
    const finalConfig = config ?? getDefaultConfig();
    if (finalConfig.useRedis && finalConfig.redis) {
        try {
            const redisCache = new redis_cache_1.RedisCache(finalConfig.redis);
            await redisCache.connect();
            logger.info('Using Redis cache');
            return redisCache;
        }
        catch (error) {
            logger.warn('Redis connection failed, falling back to in-memory cache', { error });
        }
    }
    logger.info('Using in-memory cache');
    return new memory_cache_1.MemoryCache();
}
/**
 * Get or create singleton cache instance
 */
async function getCacheClient() {
    cacheInstance ??= await createCacheClient();
    return cacheInstance;
}
/**
 * Initialize cache (call at application startup)
 */
async function initializeCache(config) {
    if (cacheInstance) {
        await cacheInstance.disconnect();
    }
    cacheInstance = await createCacheClient(config);
    return cacheInstance;
}
/**
 * Shutdown cache (call at application shutdown)
 */
async function shutdownCache() {
    if (cacheInstance) {
        await cacheInstance.disconnect();
        cacheInstance = null;
        logger.info('Cache shutdown complete');
    }
}
/**
 * Get current cache instance (sync, may be null)
 */
function getCache() {
    return cacheInstance;
}
//# sourceMappingURL=index.js.map