/**
 * Redis Cache Implementation
 * Using ioredis for Redis connection
 * Following Single Responsibility Principle (SRP)
 */
import Redis from 'ioredis';
import { ICacheClient } from './cache.interface';
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
export declare class RedisCache implements ICacheClient {
    private readonly client;
    private connected;
    private readonly keyPrefix;
    constructor(config: IRedisConfig);
    private setupEventHandlers;
    /**
     * Connect to Redis
     */
    connect(): Promise<void>;
    private prefixKey;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    /**
     * Cache-aside pattern: Get from cache or compute and cache
     */
    getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;
    /**
     * Get multiple values at once (batch operation)
     */
    mget<T>(keys: string[]): Promise<(T | null)[]>;
    /**
     * Set multiple values at once (batch operation)
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
     * Get raw Redis client for advanced operations
     */
    getClient(): Redis;
}
//# sourceMappingURL=redis.cache.d.ts.map