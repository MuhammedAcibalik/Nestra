/**
 * Rate Limit Storage Implementations
 * Redis-based and In-Memory fallback
 */

import { IRateLimitStorage } from './types';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('RateLimitStorage');

// ==================== IN-MEMORY STORAGE ====================

interface IMemoryEntry {
    value: number;
    expiresAt: number;
}

interface ISortedSetEntry {
    score: number;
    member: string;
}

export class MemoryRateLimitStorage implements IRateLimitStorage {
    private readonly data: Map<string, IMemoryEntry> = new Map();
    private readonly sortedSets: Map<string, ISortedSetEntry[]> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Cleanup expired entries every 60 seconds
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    async get(key: string): Promise<number | null> {
        const entry = this.data.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.data.delete(key);
            return null;
        }
        return entry.value;
    }

    async set(key: string, value: number, ttlMs: number): Promise<void> {
        this.data.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }

    async incr(key: string, ttlMs: number): Promise<number> {
        const current = await this.get(key);
        const newValue = (current ?? 0) + 1;
        await this.set(key, newValue, ttlMs);
        return newValue;
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        let set = this.sortedSets.get(key);
        if (!set) {
            set = [];
            this.sortedSets.set(key, set);
        }

        // Remove existing member if present
        const existingIdx = set.findIndex((e) => e.member === member);
        if (existingIdx >= 0) {
            set.splice(existingIdx, 1);
        }

        // Add new entry
        set.push({ score, member });

        // Sort by score
        set.sort((a, b) => a.score - b.score);
    }

    async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
        const set = this.sortedSets.get(key);
        if (!set) return 0;

        const before = set.length;
        const filtered = set.filter((e) => e.score < min || e.score > max);
        this.sortedSets.set(key, filtered);

        return before - filtered.length;
    }

    async zcount(key: string, min: number, max: number): Promise<number> {
        const set = this.sortedSets.get(key);
        if (!set) return 0;

        return set.filter((e) => e.score >= min && e.score <= max).length;
    }

    async del(key: string): Promise<void> {
        this.data.delete(key);
        this.sortedSets.delete(key);
    }

    isConnected(): boolean {
        return true;
    }

    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.data) {
            if (now > entry.expiresAt) {
                this.data.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Cleaned expired rate limit entries', { count: cleaned });
        }
    }

    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// ==================== REDIS STORAGE ====================

export class RedisRateLimitStorage implements IRateLimitStorage {
    private redis: import('ioredis').Redis | null = null;
    private readonly prefix = 'ratelimit:';

    constructor(private readonly redisUrl: string) {}

    async connect(): Promise<void> {
        try {
            const Redis = (await import('ioredis')).default;
            this.redis = new Redis(this.redisUrl);

            this.redis.on('error', (err) => {
                logger.error('Redis connection error', { error: err });
            });

            this.redis.on('connect', () => {
                logger.info('Redis connected for rate limiting');
            });
        } catch (error) {
            logger.error('Failed to connect to Redis', { error });
            throw error;
        }
    }

    async get(key: string): Promise<number | null> {
        if (!this.redis) return null;
        const value = await this.redis.get(this.prefix + key);
        return value ? Number.parseInt(value, 10) : null;
    }

    async set(key: string, value: number, ttlMs: number): Promise<void> {
        if (!this.redis) return;
        await this.redis.set(this.prefix + key, value, 'PX', ttlMs);
    }

    async incr(key: string, ttlMs: number): Promise<number> {
        if (!this.redis) return 1;

        const multi = this.redis.multi();
        multi.incr(this.prefix + key);
        multi.pexpire(this.prefix + key, ttlMs);

        const results = await multi.exec();
        return (results?.[0]?.[1] as number) ?? 1;
    }

    async zadd(key: string, score: number, member: string): Promise<void> {
        if (!this.redis) return;
        await this.redis.zadd(this.prefix + key, score, member);
    }

    async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
        if (!this.redis) return 0;
        return this.redis.zremrangebyscore(this.prefix + key, min, max);
    }

    async zcount(key: string, min: number, max: number): Promise<number> {
        if (!this.redis) return 0;
        return this.redis.zcount(this.prefix + key, min, max);
    }

    async del(key: string): Promise<void> {
        if (!this.redis) return;
        await this.redis.del(this.prefix + key);
    }

    isConnected(): boolean {
        return this.redis?.status === 'ready';
    }

    async disconnect(): Promise<void> {
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }
    }
}

// ==================== STORAGE FACTORY ====================

let storageInstance: IRateLimitStorage | null = null;

export async function getRateLimitStorage(redisUrl?: string): Promise<IRateLimitStorage> {
    if (storageInstance) return storageInstance;

    if (redisUrl) {
        try {
            const redisStorage = new RedisRateLimitStorage(redisUrl);
            await redisStorage.connect();
            storageInstance = redisStorage;
            return storageInstance;
        } catch {
            logger.warn('Redis unavailable, falling back to in-memory storage');
        }
    }

    storageInstance = new MemoryRateLimitStorage();
    return storageInstance;
}

export function resetRateLimitStorage(): void {
    if (storageInstance instanceof MemoryRateLimitStorage) {
        storageInstance.shutdown();
    }
    storageInstance = null;
}
