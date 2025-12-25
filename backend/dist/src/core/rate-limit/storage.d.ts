/**
 * Rate Limit Storage Implementations
 * Redis-based and In-Memory fallback
 */
import { IRateLimitStorage } from './types';
export declare class MemoryRateLimitStorage implements IRateLimitStorage {
    private readonly data;
    private readonly sortedSets;
    private cleanupInterval;
    constructor();
    get(key: string): Promise<number | null>;
    set(key: string, value: number, ttlMs: number): Promise<void>;
    incr(key: string, ttlMs: number): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<void>;
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    zcount(key: string, min: number, max: number): Promise<number>;
    del(key: string): Promise<void>;
    isConnected(): boolean;
    private cleanup;
    shutdown(): void;
}
export declare class RedisRateLimitStorage implements IRateLimitStorage {
    private readonly redisUrl;
    private redis;
    private readonly prefix;
    constructor(redisUrl: string);
    connect(): Promise<void>;
    get(key: string): Promise<number | null>;
    set(key: string, value: number, ttlMs: number): Promise<void>;
    incr(key: string, ttlMs: number): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<void>;
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    zcount(key: string, min: number, max: number): Promise<number>;
    del(key: string): Promise<void>;
    isConnected(): boolean;
    disconnect(): Promise<void>;
}
export declare function getRateLimitStorage(redisUrl?: string): Promise<IRateLimitStorage>;
export declare function resetRateLimitStorage(): void;
//# sourceMappingURL=storage.d.ts.map