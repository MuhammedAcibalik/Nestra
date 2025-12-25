"use strict";
/**
 * In-Memory Cache Implementation
 * Fallback when Redis is not available
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCache = void 0;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('MemoryCache');
/**
 * In-Memory Cache Client
 * Simple Map-based cache for development/fallback
 */
class MemoryCache {
    cache = new Map();
    cleanupInterval = null;
    constructor() {
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        logger.info('In-memory cache initialized');
    }
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger.debug(`Cleaned ${cleaned} expired cache entries`);
        }
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlSeconds) {
        const entry = {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
        };
        this.cache.set(key, entry);
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
     * Get multiple values at once
     */
    async mget(keys) {
        const results = [];
        for (const key of keys) {
            results.push(await this.get(key));
        }
        return results;
    }
    /**
     * Set multiple values at once
     */
    async mset(entries) {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
    }
    async del(key) {
        this.cache.delete(key);
    }
    async delPattern(pattern) {
        // Convert glob pattern to regex
        const regex = new RegExp('^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$');
        let deleted = 0;
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        return deleted;
    }
    async exists(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async ttl(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return -2;
        if (!entry.expiresAt)
            return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }
    async incr(key) {
        const current = await this.get(key) ?? 0;
        const newValue = current + 1;
        // Preserve TTL
        const entry = this.cache.get(key);
        const ttl = entry?.expiresAt
            ? Math.ceil((entry.expiresAt - Date.now()) / 1000)
            : undefined;
        await this.set(key, newValue, ttl);
        return newValue;
    }
    async expire(key, ttlSeconds) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        entry.expiresAt = Date.now() + ttlSeconds * 1000;
        return true;
    }
    isConnected() {
        return true; // Always "connected"
    }
    async disconnect() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.cache.clear();
        logger.info('In-memory cache cleared');
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
exports.MemoryCache = MemoryCache;
//# sourceMappingURL=memory.cache.js.map