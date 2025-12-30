/**
 * Cache Module - Barrel Export
 * Factory function for cache client creation
 */

import { ICacheClient } from './cache.interface';
import { RedisCache, IRedisConfig } from './redis.cache';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('CacheFactory');

export { ICacheClient, CachePrefix, CacheTTL } from './cache.interface';
export { RedisCache, IRedisConfig } from './redis.cache';

// Singleton cache instance
let cacheInstance: ICacheClient | null = null;

/**
 * Cache configuration from environment
 */
export interface ICacheFactoryConfig {
    useRedis?: boolean;
    redis?: IRedisConfig;
}

/**
 * Get default cache configuration from environment
 */
function getDefaultConfig(): ICacheFactoryConfig {
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
        } catch {
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
 * Redis is REQUIRED - no in-memory fallback
 */
export async function createCacheClient(config?: ICacheFactoryConfig): Promise<ICacheClient> {
    const finalConfig = config ?? getDefaultConfig();

    if (!finalConfig.useRedis || !finalConfig.redis) {
        throw new Error('Redis configuration is required. Set USE_REDIS=true and provide REDIS_HOST/REDIS_PORT or REDIS_URL');
    }

    const redisCache = new RedisCache(finalConfig.redis);
    await redisCache.connect();
    logger.info('Redis cache connected', {
        host: finalConfig.redis.host,
        port: finalConfig.redis.port
    });
    return redisCache;
}

/**
 * Get or create singleton cache instance
 */
export async function getCacheClient(): Promise<ICacheClient> {
    cacheInstance ??= await createCacheClient();
    return cacheInstance;
}

/**
 * Initialize cache (call at application startup)
 */
export async function initializeCache(config?: ICacheFactoryConfig): Promise<ICacheClient> {
    if (cacheInstance) {
        await cacheInstance.disconnect();
    }
    cacheInstance = await createCacheClient(config);
    return cacheInstance;
}

/**
 * Shutdown cache (call at application shutdown)
 */
export async function shutdownCache(): Promise<void> {
    if (cacheInstance) {
        await cacheInstance.disconnect();
        cacheInstance = null;
        logger.info('Cache shutdown complete');
    }
}

/**
 * Get current cache instance (sync, may be null)
 */
export function getCache(): ICacheClient | null {
    return cacheInstance;
}
