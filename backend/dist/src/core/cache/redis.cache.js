"use strict";
/**
 * Redis Cache Implementation
 * Using ioredis for Redis connection
 * Following Single Responsibility Principle (SRP)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('RedisCache');
/**
 * Redis Cache Client
 * Implements ICacheClient interface for Redis backend
 */
class RedisCache {
    client;
    connected = false;
    keyPrefix;
    constructor(config) {
        this.keyPrefix = config.keyPrefix ?? 'nestra:';
        this.client = new ioredis_1.default({
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
    setupEventHandlers() {
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
    async connect() {
        try {
            await this.client.connect();
            this.connected = true;
        }
        catch (error) {
            logger.error('Redis connect failed', { error });
            throw error;
        }
    }
    prefixKey(key) {
        return `${this.keyPrefix}${key}`;
    }
    async get(key) {
        try {
            const value = await this.client.get(this.prefixKey(key));
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            logger.error('Cache get error', { key, error });
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            const prefixedKey = this.prefixKey(key);
            if (ttlSeconds) {
                await this.client.setex(prefixedKey, ttlSeconds, serialized);
            }
            else {
                await this.client.set(prefixedKey, serialized);
            }
        }
        catch (error) {
            logger.error('Cache set error', { key, error });
        }
    }
    /**
     * Cache-aside pattern: Get from cache or compute and cache
     */
    async getOrSet(key, factory, ttlSeconds) {
        const cached = await this.get(key);
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
    async mget(keys) {
        if (keys.length === 0)
            return [];
        try {
            const prefixedKeys = keys.map(k => this.prefixKey(k));
            const values = await this.client.mget(...prefixedKeys);
            return values.map(v => {
                if (!v)
                    return null;
                try {
                    return JSON.parse(v);
                }
                catch {
                    return null;
                }
            });
        }
        catch (error) {
            logger.error('Cache mget error', { keys, error });
            return keys.map(() => null);
        }
    }
    /**
     * Set multiple values at once (batch operation)
     */
    async mset(entries) {
        if (entries.length === 0)
            return;
        try {
            const pipeline = this.client.pipeline();
            for (const entry of entries) {
                const prefixedKey = this.prefixKey(entry.key);
                const serialized = JSON.stringify(entry.value);
                if (entry.ttl) {
                    pipeline.setex(prefixedKey, entry.ttl, serialized);
                }
                else {
                    pipeline.set(prefixedKey, serialized);
                }
            }
            await pipeline.exec();
        }
        catch (error) {
            logger.error('Cache mset error', { count: entries.length, error });
        }
    }
    async del(key) {
        try {
            await this.client.del(this.prefixKey(key));
        }
        catch (error) {
            logger.error('Cache del error', { key, error });
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.client.keys(this.prefixKey(pattern));
            if (keys.length === 0)
                return 0;
            return await this.client.del(...keys);
        }
        catch (error) {
            logger.error('Cache delPattern error', { pattern, error });
            return 0;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(this.prefixKey(key));
            return result === 1;
        }
        catch (error) {
            logger.error('Cache exists error', { key, error });
            return false;
        }
    }
    async ttl(key) {
        try {
            return await this.client.ttl(this.prefixKey(key));
        }
        catch (error) {
            logger.error('Cache ttl error', { key, error });
            return -2;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(this.prefixKey(key));
        }
        catch (error) {
            logger.error('Cache incr error', { key, error });
            return 0;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            const result = await this.client.expire(this.prefixKey(key), ttlSeconds);
            return result === 1;
        }
        catch (error) {
            logger.error('Cache expire error', { key, error });
            return false;
        }
    }
    isConnected() {
        return this.connected && this.client.status === 'ready';
    }
    async disconnect() {
        try {
            await this.client.quit();
            this.connected = false;
            logger.info('Redis disconnected');
        }
        catch (error) {
            logger.error('Redis disconnect error', { error });
        }
    }
    /**
     * Get raw Redis client for advanced operations
     */
    getClient() {
        return this.client;
    }
}
exports.RedisCache = RedisCache;
//# sourceMappingURL=redis.cache.js.map