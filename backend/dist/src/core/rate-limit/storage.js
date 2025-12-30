"use strict";
/**
 * Rate Limit Storage Implementations
 * Redis-based and In-Memory fallback
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRateLimitStorage = exports.MemoryRateLimitStorage = void 0;
exports.getRateLimitStorage = getRateLimitStorage;
exports.resetRateLimitStorage = resetRateLimitStorage;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('RateLimitStorage');
class MemoryRateLimitStorage {
    data = new Map();
    sortedSets = new Map();
    cleanupInterval = null;
    constructor() {
        // Cleanup expired entries every 60 seconds
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
    async get(key) {
        const entry = this.data.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.data.delete(key);
            return null;
        }
        return entry.value;
    }
    async set(key, value, ttlMs) {
        this.data.set(key, {
            value,
            expiresAt: Date.now() + ttlMs
        });
    }
    async incr(key, ttlMs) {
        const current = await this.get(key);
        const newValue = (current ?? 0) + 1;
        await this.set(key, newValue, ttlMs);
        return newValue;
    }
    async zadd(key, score, member) {
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
    async zremrangebyscore(key, min, max) {
        const set = this.sortedSets.get(key);
        if (!set)
            return 0;
        const before = set.length;
        const filtered = set.filter((e) => e.score < min || e.score > max);
        this.sortedSets.set(key, filtered);
        return before - filtered.length;
    }
    async zcount(key, min, max) {
        const set = this.sortedSets.get(key);
        if (!set)
            return 0;
        return set.filter((e) => e.score >= min && e.score <= max).length;
    }
    async del(key) {
        this.data.delete(key);
        this.sortedSets.delete(key);
    }
    isConnected() {
        return true;
    }
    cleanup() {
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
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
exports.MemoryRateLimitStorage = MemoryRateLimitStorage;
// ==================== REDIS STORAGE ====================
class RedisRateLimitStorage {
    redisUrl;
    redis = null;
    prefix = 'ratelimit:';
    constructor(redisUrl) {
        this.redisUrl = redisUrl;
    }
    async connect() {
        try {
            const Redis = (await Promise.resolve().then(() => __importStar(require('ioredis')))).default;
            this.redis = new Redis(this.redisUrl);
            this.redis.on('error', (err) => {
                logger.error('Redis connection error', { error: err });
            });
            this.redis.on('connect', () => {
                logger.info('Redis connected for rate limiting');
            });
        }
        catch (error) {
            logger.error('Failed to connect to Redis', { error });
            throw error;
        }
    }
    async get(key) {
        if (!this.redis)
            return null;
        const value = await this.redis.get(this.prefix + key);
        return value ? Number.parseInt(value, 10) : null;
    }
    async set(key, value, ttlMs) {
        if (!this.redis)
            return;
        await this.redis.set(this.prefix + key, value, 'PX', ttlMs);
    }
    async incr(key, ttlMs) {
        if (!this.redis)
            return 1;
        const multi = this.redis.multi();
        multi.incr(this.prefix + key);
        multi.pexpire(this.prefix + key, ttlMs);
        const results = await multi.exec();
        return results?.[0]?.[1] ?? 1;
    }
    async zadd(key, score, member) {
        if (!this.redis)
            return;
        await this.redis.zadd(this.prefix + key, score, member);
    }
    async zremrangebyscore(key, min, max) {
        if (!this.redis)
            return 0;
        return this.redis.zremrangebyscore(this.prefix + key, min, max);
    }
    async zcount(key, min, max) {
        if (!this.redis)
            return 0;
        return this.redis.zcount(this.prefix + key, min, max);
    }
    async del(key) {
        if (!this.redis)
            return;
        await this.redis.del(this.prefix + key);
    }
    isConnected() {
        return this.redis?.status === 'ready';
    }
    async disconnect() {
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }
    }
}
exports.RedisRateLimitStorage = RedisRateLimitStorage;
// ==================== STORAGE FACTORY ====================
let storageInstance = null;
async function getRateLimitStorage(redisUrl) {
    if (storageInstance)
        return storageInstance;
    if (redisUrl) {
        try {
            const redisStorage = new RedisRateLimitStorage(redisUrl);
            await redisStorage.connect();
            storageInstance = redisStorage;
            return storageInstance;
        }
        catch {
            logger.warn('Redis unavailable, falling back to in-memory storage');
        }
    }
    storageInstance = new MemoryRateLimitStorage();
    return storageInstance;
}
function resetRateLimitStorage() {
    if (storageInstance instanceof MemoryRateLimitStorage) {
        storageInstance.shutdown();
    }
    storageInstance = null;
}
//# sourceMappingURL=storage.js.map