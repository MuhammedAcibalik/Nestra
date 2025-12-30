/**
 * Prediction Cache Service
 * Feature hash-based caching for ML predictions
 * 
 * Features:
 * - Feature vector hashing
 * - TTL with drift invalidation
 * - Cache hit ratio tracking
 * - Memory-efficient storage
 */

import { createHash } from 'crypto';
import { createModuleLogger } from '../../../../core/logger';
import { ICacheClient } from '../../../../core/cache/cache.interface';
import { MLModelType, IServiceResult } from '../../domain';

const logger = createModuleLogger('PredictionCache');

// ==================== TYPES ====================

export interface IPredictionCacheConfig {
    /** Default TTL in seconds (default: 3600 = 1 hour) */
    defaultTtlSeconds: number;
    /** Maximum cache size per model (default: 10000) */
    maxCacheSize: number;
    /** Enable statistics tracking (default: true) */
    enableStats: boolean;
    /** Hash algorithm (default: 'sha256') */
    hashAlgorithm: 'md5' | 'sha256' | 'sha512';
    /** Key prefix (default: 'ml:pred:') */
    keyPrefix: string;
}

export interface ICachedPrediction<T = unknown> {
    prediction: T;
    modelVersion: string;
    confidence: number;
    cachedAt: Date;
    expiresAt: Date;
    hitCount: number;
}

export interface ICacheStats {
    totalHits: number;
    totalMisses: number;
    hitRatio: number;
    cacheSize: number;
    avgHitLatencyMs: number;
    avgMissLatencyMs: number;
    evictions: number;
    lastResetAt: Date;
}

export interface ICacheKey {
    modelType: MLModelType;
    modelVersion: string;
    featureHash: string;
}

const DEFAULT_CONFIG: IPredictionCacheConfig = {
    defaultTtlSeconds: 3600,
    maxCacheSize: 10000,
    enableStats: true,
    hashAlgorithm: 'sha256',
    keyPrefix: 'ml:pred:'
};

// ==================== SERVICE ====================

export class PredictionCacheService {
    private readonly config: IPredictionCacheConfig;
    private stats: Map<MLModelType, ICacheStats> = new Map();
    private localCache: Map<string, ICachedPrediction> = new Map(); // Fallback

    constructor(
        private readonly cacheClient: ICacheClient | null,
        config?: Partial<IPredictionCacheConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeStats();
    }

    // ==================== PUBLIC API ====================

    /**
     * Get cached prediction
     */
    async get<T>(
        modelType: MLModelType,
        modelVersion: string,
        features: Record<string, unknown>
    ): Promise<ICachedPrediction<T> | null> {
        const startTime = Date.now();
        const key = this.buildCacheKey(modelType, modelVersion, features);

        try {
            let cached: ICachedPrediction<T> | null = null;

            if (this.cacheClient) {
                const raw = await this.cacheClient.get<string>(key);
                if (raw && typeof raw === 'string') {
                    cached = JSON.parse(raw) as ICachedPrediction<T>;
                }
            } else {
                cached = this.localCache.get(key) as ICachedPrediction<T> | undefined ?? null;
            }

            if (cached) {
                // Check expiration
                if (new Date(cached.expiresAt) < new Date()) {
                    await this.invalidate(modelType, modelVersion, features);
                    this.recordMiss(modelType, Date.now() - startTime);
                    return null;
                }

                // Update hit count
                cached.hitCount++;
                this.recordHit(modelType, Date.now() - startTime);

                logger.debug('Cache hit', { modelType, featureHash: key.substring(key.lastIndexOf(':') + 1) });
                return cached;
            }

            this.recordMiss(modelType, Date.now() - startTime);
            return null;

        } catch (error) {
            logger.error('Cache get failed', { key, error });
            this.recordMiss(modelType, Date.now() - startTime);
            return null;
        }
    }

    /**
     * Set cached prediction
     */
    async set<T>(
        modelType: MLModelType,
        modelVersion: string,
        features: Record<string, unknown>,
        prediction: T,
        confidence: number,
        ttlSeconds?: number
    ): Promise<void> {
        const key = this.buildCacheKey(modelType, modelVersion, features);
        const ttl = ttlSeconds ?? this.config.defaultTtlSeconds;
        const now = new Date();

        const cached: ICachedPrediction<T> = {
            prediction,
            modelVersion,
            confidence,
            cachedAt: now,
            expiresAt: new Date(now.getTime() + ttl * 1000),
            hitCount: 0
        };

        try {
            if (this.cacheClient) {
                await this.cacheClient.set(key, JSON.stringify(cached), ttl);
            } else {
                // Use local cache with size limit
                if (this.localCache.size >= this.config.maxCacheSize) {
                    this.evictOldest();
                }
                this.localCache.set(key, cached as ICachedPrediction);
            }

            logger.debug('Prediction cached', { modelType, ttl });

        } catch (error) {
            logger.error('Cache set failed', { key, error });
        }
    }

    /**
     * Get or compute prediction
     */
    async getOrCompute<T>(
        modelType: MLModelType,
        modelVersion: string,
        features: Record<string, unknown>,
        computeFn: () => Promise<{ prediction: T; confidence: number }>,
        ttlSeconds?: number
    ): Promise<IServiceResult<{ prediction: T; confidence: number; fromCache: boolean }>> {
        try {
            // Try cache first
            const cached = await this.get<T>(modelType, modelVersion, features);
            if (cached) {
                return {
                    success: true,
                    data: {
                        prediction: cached.prediction,
                        confidence: cached.confidence,
                        fromCache: true
                    }
                };
            }

            // Compute
            const result = await computeFn();

            // Store in cache
            await this.set(modelType, modelVersion, features, result.prediction, result.confidence, ttlSeconds);

            return {
                success: true,
                data: {
                    ...result,
                    fromCache: false
                }
            };

        } catch (error) {
            logger.error('Get or compute failed', { modelType, error });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Compute failed'
            };
        }
    }

    /**
     * Invalidate specific cache entry
     */
    async invalidate(
        modelType: MLModelType,
        modelVersion: string,
        features: Record<string, unknown>
    ): Promise<void> {
        const key = this.buildCacheKey(modelType, modelVersion, features);

        try {
            if (this.cacheClient) {
                await this.cacheClient.del(key);
            } else {
                this.localCache.delete(key);
            }
        } catch (error) {
            logger.error('Cache invalidation failed', { key, error });
        }
    }

    /**
     * Invalidate all cache for a model version (e.g., after drift detection)
     */
    async invalidateModel(modelType: MLModelType, modelVersion?: string): Promise<number> {
        const pattern = modelVersion
            ? `${this.config.keyPrefix}${modelType}:${modelVersion}:*`
            : `${this.config.keyPrefix}${modelType}:*`;

        try {
            if (this.cacheClient) {
                // Redis pattern delete would be done here
                // Most cache clients don't support pattern delete directly
                logger.info('Model cache invalidation requested', { modelType, modelVersion, pattern });
                return 0; // Would return actual count
            } else {
                let count = 0;
                const prefix = modelVersion
                    ? `${this.config.keyPrefix}${modelType}:${modelVersion}`
                    : `${this.config.keyPrefix}${modelType}`;

                for (const key of this.localCache.keys()) {
                    if (key.startsWith(prefix)) {
                        this.localCache.delete(key);
                        count++;
                    }
                }

                const stats = this.stats.get(modelType);
                if (stats) {
                    stats.evictions += count;
                }

                logger.info('Model cache invalidated', { modelType, count });
                return count;
            }

        } catch (error) {
            logger.error('Model cache invalidation failed', { modelType, error });
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    getStats(modelType?: MLModelType): ICacheStats | Map<MLModelType, ICacheStats> {
        if (modelType) {
            return this.stats.get(modelType) ?? this.createEmptyStats();
        }
        return this.stats;
    }

    /**
     * Reset statistics
     */
    resetStats(modelType?: MLModelType): void {
        if (modelType) {
            this.stats.set(modelType, this.createEmptyStats());
        } else {
            this.initializeStats();
        }
    }

    /**
     * Clear all cache
     */
    async clear(): Promise<void> {
        try {
            if (this.cacheClient) {
                // Would need pattern-based clear in Redis
                logger.warn('Redis cache clear not implemented - use pattern delete');
            } else {
                this.localCache.clear();
            }
            this.initializeStats();
            logger.info('Cache cleared');
        } catch (error) {
            logger.error('Cache clear failed', { error });
        }
    }

    // ==================== PRIVATE METHODS ====================

    private buildCacheKey(
        modelType: MLModelType,
        modelVersion: string,
        features: Record<string, unknown>
    ): string {
        const featureHash = this.hashFeatures(features);
        return `${this.config.keyPrefix}${modelType}:${modelVersion}:${featureHash}`;
    }

    private hashFeatures(features: Record<string, unknown>): string {
        // Sort keys for consistent hashing
        const sortedKeys = Object.keys(features).sort();
        const values = sortedKeys.map(k => {
            const v = features[k];
            return typeof v === 'number' ? v.toFixed(6) : String(v);
        });

        const content = sortedKeys.map((k, i) => `${k}:${values[i]}`).join('|');

        return createHash(this.config.hashAlgorithm)
            .update(content)
            .digest('hex')
            .substring(0, 16);
    }

    private initializeStats(): void {
        const modelTypes: MLModelType[] = ['waste_predictor', 'algorithm_selector', 'time_estimator'];
        for (const type of modelTypes) {
            this.stats.set(type, this.createEmptyStats());
        }
    }

    private createEmptyStats(): ICacheStats {
        return {
            totalHits: 0,
            totalMisses: 0,
            hitRatio: 0,
            cacheSize: 0,
            avgHitLatencyMs: 0,
            avgMissLatencyMs: 0,
            evictions: 0,
            lastResetAt: new Date()
        };
    }

    private recordHit(modelType: MLModelType, latencyMs: number): void {
        if (!this.config.enableStats) return;

        const stats = this.stats.get(modelType) ?? this.createEmptyStats();
        stats.totalHits++;
        stats.avgHitLatencyMs = (stats.avgHitLatencyMs * (stats.totalHits - 1) + latencyMs) / stats.totalHits;
        stats.hitRatio = stats.totalHits / (stats.totalHits + stats.totalMisses);
        this.stats.set(modelType, stats);
    }

    private recordMiss(modelType: MLModelType, latencyMs: number): void {
        if (!this.config.enableStats) return;

        const stats = this.stats.get(modelType) ?? this.createEmptyStats();
        stats.totalMisses++;
        stats.avgMissLatencyMs = (stats.avgMissLatencyMs * (stats.totalMisses - 1) + latencyMs) / stats.totalMisses;
        stats.hitRatio = stats.totalHits / (stats.totalHits + stats.totalMisses);
        this.stats.set(modelType, stats);
    }

    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, value] of this.localCache.entries()) {
            const cachedTime = new Date(value.cachedAt).getTime();
            if (cachedTime < oldestTime) {
                oldestTime = cachedTime;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.localCache.delete(oldestKey);
            // Update eviction stats for all model types (we don't track per-model in local cache)
            for (const stats of this.stats.values()) {
                stats.evictions++;
            }
        }
    }
}

// ==================== FACTORY ====================

export function createPredictionCacheService(
    cacheClient: ICacheClient | null,
    config?: Partial<IPredictionCacheConfig>
): PredictionCacheService {
    return new PredictionCacheService(cacheClient, config);
}
