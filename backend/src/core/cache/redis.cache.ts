/**
 * Redis Cache Implementation
 * Using ioredis for Redis connection
 * Following Single Responsibility Principle (SRP)
 */

import Redis from 'ioredis';
import { ICacheClient } from './cache.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('RedisCache');

export interface IRedisConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    maxRetriesPerRequest?: number;
    retryDelayMs?: number;
}

/**
 * Redis Cache Client
 * Implements ICacheClient interface for Redis backend
 */
export class RedisCache implements ICacheClient {
    private readonly client: Redis;
    private connected = false;
    private readonly keyPrefix: string;

    constructor(config: IRedisConfig) {
        this.keyPrefix = config.keyPrefix ?? 'nestra:';

        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            db: config.db ?? 0,
            maxRetriesPerRequest: config.maxRetriesPerRequest ?? 3,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger.error('Redis connection failed after 10 retries');
                    return null; // Stop retrying
                }
                return Math.min(times * (config.retryDelayMs ?? 100), 3000);
            },
            lazyConnect: true
        });

        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        this.client.on('connect', () => {
            this.connected = true;
            logger.info('Redis connected');
        });

        this.client.on('ready', () => {
            this.connected = true;
            logger.info('Redis ready');
        });

        this.client.on('error', (err) => {
            logger.error('Redis error', { error: err.message });
        });

        this.client.on('close', () => {
            this.connected = false;
            logger.warn('Redis connection closed');
        });

        this.client.on('reconnecting', () => {
            logger.info('Redis reconnecting...');
        });
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<void> {
        try {
            await this.client.connect();
            this.connected = true;
        } catch (error) {
            logger.error('Redis connect failed', { error });
            throw error;
        }
    }

    private prefixKey(key: string): string {
        return `${this.keyPrefix}${key}`;
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(this.prefixKey(key));
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Cache get error', { key, error });
            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            const prefixedKey = this.prefixKey(key);

            if (ttlSeconds) {
                await this.client.setex(prefixedKey, ttlSeconds, serialized);
            } else {
                await this.client.set(prefixedKey, serialized);
            }
        } catch (error) {
            logger.error('Cache set error', { key, error });
        }
    }

    /**
     * Cache-aside pattern: Get from cache or compute and cache
     */
    async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await factory();
        await this.set(key, value, ttlSeconds);
        return value;
    }

    /**
     * Get multiple values at once (batch operation)
     */
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        if (keys.length === 0) return [];

        try {
            const prefixedKeys = keys.map((k) => this.prefixKey(k));
            const values = await this.client.mget(...prefixedKeys);

            return values.map((v) => {
                if (!v) return null;
                try {
                    return JSON.parse(v) as T;
                } catch {
                    return null;
                }
            });
        } catch (error) {
            logger.error('Cache mget error', { keys, error });
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple values at once (batch operation)
     */
    async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
        if (entries.length === 0) return;

        try {
            const pipeline = this.client.pipeline();

            for (const entry of entries) {
                const prefixedKey = this.prefixKey(entry.key);
                const serialized = JSON.stringify(entry.value);

                if (entry.ttl) {
                    pipeline.setex(prefixedKey, entry.ttl, serialized);
                } else {
                    pipeline.set(prefixedKey, serialized);
                }
            }

            await pipeline.exec();
        } catch (error) {
            logger.error('Cache mset error', { count: entries.length, error });
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.client.del(this.prefixKey(key));
        } catch (error) {
            logger.error('Cache del error', { key, error });
        }
    }

    async delPattern(pattern: string): Promise<number> {
        try {
            const keys = await this.client.keys(this.prefixKey(pattern));
            if (keys.length === 0) return 0;
            return await this.client.del(...keys);
        } catch (error) {
            logger.error('Cache delPattern error', { pattern, error });
            return 0;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(this.prefixKey(key));
            return result === 1;
        } catch (error) {
            logger.error('Cache exists error', { key, error });
            return false;
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.client.ttl(this.prefixKey(key));
        } catch (error) {
            logger.error('Cache ttl error', { key, error });
            return -2;
        }
    }

    async incr(key: string): Promise<number> {
        try {
            return await this.client.incr(this.prefixKey(key));
        } catch (error) {
            logger.error('Cache incr error', { key, error });
            return 0;
        }
    }

    async expire(key: string, ttlSeconds: number): Promise<boolean> {
        try {
            const result = await this.client.expire(this.prefixKey(key), ttlSeconds);
            return result === 1;
        } catch (error) {
            logger.error('Cache expire error', { key, error });
            return false;
        }
    }

    isConnected(): boolean {
        return this.connected && this.client.status === 'ready';
    }

    async disconnect(): Promise<void> {
        try {
            await this.client.quit();
            this.connected = false;
            logger.info('Redis disconnected');
        } catch (error) {
            logger.error('Redis disconnect error', { error });
        }
    }

    /**
     * Get raw Redis client for advanced operations
     */
    getClient(): Redis {
        return this.client;
    }
}
