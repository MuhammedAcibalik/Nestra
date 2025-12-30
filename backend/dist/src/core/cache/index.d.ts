/**
 * Cache Module - Barrel Export
 * Factory function for cache client creation
 */
import { ICacheClient } from './cache.interface';
import { IRedisConfig } from './redis.cache';
export { ICacheClient, CachePrefix, CacheTTL } from './cache.interface';
export { RedisCache, IRedisConfig } from './redis.cache';
/**
 * Cache configuration from environment
 */
export interface ICacheFactoryConfig {
    useRedis?: boolean;
    redis?: IRedisConfig;
}
/**
 * Create cache client based on configuration
 * Redis is REQUIRED - no in-memory fallback
 */
export declare function createCacheClient(config?: ICacheFactoryConfig): Promise<ICacheClient>;
/**
 * Get or create singleton cache instance
 */
export declare function getCacheClient(): Promise<ICacheClient>;
/**
 * Initialize cache (call at application startup)
 */
export declare function initializeCache(config?: ICacheFactoryConfig): Promise<ICacheClient>;
/**
 * Shutdown cache (call at application shutdown)
 */
export declare function shutdownCache(): Promise<void>;
/**
 * Get current cache instance (sync, may be null)
 */
export declare function getCache(): ICacheClient | null;
//# sourceMappingURL=index.d.ts.map