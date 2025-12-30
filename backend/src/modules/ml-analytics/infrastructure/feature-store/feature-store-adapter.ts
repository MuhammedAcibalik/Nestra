/**
 * Feature Store Adapter Interface & Implementations
 * Abstracts storage backend for feature caching
 * 
 * Following Adapter Pattern - allows swapping between
 * in-memory (dev) and Redis (production) storage
 */

import { createModuleLogger } from '../../../../core/logger';
import { ICacheClient } from '../../../../core/cache/cache.interface';

const logger = createModuleLogger('FeatureStoreAdapter');

// ==================== TYPES ====================

export interface ICachedFeature {
    key: string;
    featureId: string;
    value: number | string | boolean | number[];
    version: number;
    cachedAt: Date;
    expiresAt: Date;
}

export interface IFeatureStatistics {
    featureId: string;
    sampleCount: number;
    mean: number;
    std: number;
    min: number;
    max: number;
    lastUpdated: Date;
}

/**
 * Interface for feature store storage backends
 */
export interface IFeatureStoreAdapter {
    /** Get cached feature */
    get(key: string): Promise<ICachedFeature | null>;

    /** Set cached feature */
    set(key: string, value: ICachedFeature, ttlMs?: number): Promise<void>;

    /** Delete cached feature */
    delete(key: string): Promise<void>;

    /** Clear features matching pattern */
    clear(pattern?: string): Promise<void>;

    /** Get multiple features */
    mget(keys: string[]): Promise<Map<string, ICachedFeature | null>>;

    /** Set multiple features */
    mset(entries: Array<{ key: string; value: ICachedFeature; ttlMs?: number }>): Promise<void>;

    /** Get feature statistics */
    getStats(featureId: string): Promise<IFeatureStatistics | null>;

    /** Set feature statistics */
    setStats(stats: IFeatureStatistics): Promise<void>;
}

// ==================== IN-MEMORY IMPLEMENTATION ====================

export class InMemoryFeatureStoreAdapter implements IFeatureStoreAdapter {
    private readonly cache: Map<string, ICachedFeature> = new Map();
    private readonly statistics: Map<string, IFeatureStatistics> = new Map();

    async get(key: string): Promise<ICachedFeature | null> {
        const cached = this.cache.get(key);

        if (!cached) return null;

        // Check expiration
        if (cached.expiresAt < new Date()) {
            this.cache.delete(key);
            return null;
        }

        return cached;
    }

    async set(key: string, value: ICachedFeature, _ttlMs?: number): Promise<void> {
        this.cache.set(key, value);
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(pattern?: string): Promise<void> {
        if (pattern) {
            const regex = new RegExp(pattern.replace('*', '.*'));
            for (const key of this.cache.keys()) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    async mget(keys: string[]): Promise<Map<string, ICachedFeature | null>> {
        const result = new Map<string, ICachedFeature | null>();
        for (const key of keys) {
            result.set(key, await this.get(key));
        }
        return result;
    }

    async mset(entries: Array<{ key: string; value: ICachedFeature; ttlMs?: number }>): Promise<void> {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttlMs);
        }
    }

    async getStats(featureId: string): Promise<IFeatureStatistics | null> {
        return this.statistics.get(featureId) ?? null;
    }

    async setStats(stats: IFeatureStatistics): Promise<void> {
        this.statistics.set(stats.featureId, stats);
    }
}

// ==================== REDIS IMPLEMENTATION ====================

const FEATURE_PREFIX = 'feature:';
const STATS_PREFIX = 'feature_stats:';

export class RedisFeatureStoreAdapter implements IFeatureStoreAdapter {
    constructor(
        private readonly redis: ICacheClient,
        private readonly defaultTtlMs: number = 3600000 // 1 hour
    ) {
        logger.info('Redis feature store adapter initialized');
    }

    async get(key: string): Promise<ICachedFeature | null> {
        try {
            const data = await this.redis.get<ICachedFeature>(`${FEATURE_PREFIX}${key}`);

            if (!data) return null;

            // Convert date strings back to Date objects
            return {
                ...data,
                cachedAt: new Date(data.cachedAt),
                expiresAt: new Date(data.expiresAt)
            };
        } catch (error) {
            logger.error('Failed to get feature from Redis', { key, error });
            return null;
        }
    }

    async set(key: string, value: ICachedFeature, ttlMs?: number): Promise<void> {
        try {
            await this.redis.set(
                `${FEATURE_PREFIX}${key}`,
                value,
                ttlMs ?? this.defaultTtlMs
            );
        } catch (error) {
            logger.error('Failed to set feature in Redis', { key, error });
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.redis.del(`${FEATURE_PREFIX}${key}`);
        } catch (error) {
            logger.error('Failed to delete feature from Redis', { key, error });
        }
    }

    async clear(pattern?: string): Promise<void> {
        try {
            if (pattern) {
                // Redis SCAN with pattern - simplified implementation
                logger.warn('Pattern-based clear not fully implemented for Redis');
            } else {
                // Would need SCAN to delete all with prefix
                logger.warn('Clear all not implemented for Redis - use with caution');
            }
        } catch (error) {
            logger.error('Failed to clear features from Redis', { pattern, error });
        }
    }

    async mget(keys: string[]): Promise<Map<string, ICachedFeature | null>> {
        const result = new Map<string, ICachedFeature | null>();

        try {
            const prefixedKeys = keys.map(k => `${FEATURE_PREFIX}${k}`);
            const valuesArray = await this.redis.mget<ICachedFeature>(prefixedKeys);

            keys.forEach((key, i) => {
                const value = valuesArray[i];
                if (value) {
                    result.set(key, {
                        ...value,
                        cachedAt: new Date(value.cachedAt),
                        expiresAt: new Date(value.expiresAt)
                    });
                } else {
                    result.set(key, null);
                }
            });
        } catch (error) {
            logger.error('Failed to mget features from Redis', { error });
            // Return all nulls on error
            keys.forEach(key => result.set(key, null));
        }

        return result;
    }

    async mset(entries: Array<{ key: string; value: ICachedFeature; ttlMs?: number }>): Promise<void> {
        try {
            const redisEntries = entries.map(e => ({
                key: `${FEATURE_PREFIX}${e.key}`,
                value: e.value,
                ttl: Math.round((e.ttlMs ?? this.defaultTtlMs) / 1000) // Convert to seconds
            }));

            await this.redis.mset(redisEntries);
        } catch (error) {
            logger.error('Failed to mset features in Redis', { error });
        }
    }

    async getStats(featureId: string): Promise<IFeatureStatistics | null> {
        try {
            const data = await this.redis.get<IFeatureStatistics>(`${STATS_PREFIX}${featureId}`);

            if (!data) return null;

            return {
                ...data,
                lastUpdated: new Date(data.lastUpdated)
            };
        } catch (error) {
            logger.error('Failed to get stats from Redis', { featureId, error });
            return null;
        }
    }

    async setStats(stats: IFeatureStatistics): Promise<void> {
        try {
            // Stats don't expire - they're updated on demand
            await this.redis.set(
                `${STATS_PREFIX}${stats.featureId}`,
                stats,
                86400000 // 24 hours
            );
        } catch (error) {
            logger.error('Failed to set stats in Redis', { featureId: stats.featureId, error });
        }
    }
}

// ==================== FACTORY ====================

export function createFeatureStoreAdapter(
    redis?: ICacheClient
): IFeatureStoreAdapter {
    if (redis) {
        return new RedisFeatureStoreAdapter(redis);
    }
    return new InMemoryFeatureStoreAdapter();
}
