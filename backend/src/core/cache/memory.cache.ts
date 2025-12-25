/**
 * In-Memory Cache Implementation
 * Fallback when Redis is not available
 * Following Single Responsibility Principle (SRP)
 */

import { ICacheClient } from './cache.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('MemoryCache');

interface CacheEntry<T> {
    value: T;
    expiresAt?: number;
}

/**
 * In-Memory Cache Client
 * Simple Map-based cache for development/fallback
 */
export class MemoryCache implements ICacheClient {
    private readonly cache: Map<string, CacheEntry<unknown>> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
        logger.info('In-memory cache initialized');
    }

    private cleanup(): void {
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

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;

        if (!entry) return null;

        // Check expiration
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        const entry: CacheEntry<T> = {
            value,
            expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined
        };
        this.cache.set(key, entry);
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
     * Get multiple values at once
     */
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        const results: (T | null)[] = [];
        for (const key of keys) {
            results.push(await this.get<T>(key));
        }
        return results;
    }

    /**
     * Set multiple values at once
     */
    async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
        for (const entry of entries) {
            await this.set(entry.key, entry.value, entry.ttl);
        }
    }

    async del(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async delPattern(pattern: string): Promise<number> {
        // Convert glob pattern to regex
        const regex = new RegExp(
            '^' + pattern.replaceAll('*', '.*').replaceAll('?', '.') + '$'
        );

        let deleted = 0;
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deleted++;
            }
        }
        return deleted;
    }

    async exists(key: string): Promise<boolean> {
        const entry = this.cache.get(key);
        if (!entry) return false;

        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    async ttl(key: string): Promise<number> {
        const entry = this.cache.get(key);
        if (!entry) return -2;
        if (!entry.expiresAt) return -1;

        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    }

    async incr(key: string): Promise<number> {
        const current = await this.get<number>(key) ?? 0;
        const newValue = current + 1;

        // Preserve TTL
        const entry = this.cache.get(key);
        const ttl = entry?.expiresAt
            ? Math.ceil((entry.expiresAt - Date.now()) / 1000)
            : undefined;

        await this.set(key, newValue, ttl);
        return newValue;
    }

    async expire(key: string, ttlSeconds: number): Promise<boolean> {
        const entry = this.cache.get(key);
        if (!entry) return false;

        entry.expiresAt = Date.now() + ttlSeconds * 1000;
        return true;
    }

    isConnected(): boolean {
        return true; // Always "connected"
    }

    async disconnect(): Promise<void> {
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
    getStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}
