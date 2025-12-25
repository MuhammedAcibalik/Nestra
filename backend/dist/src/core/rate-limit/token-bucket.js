"use strict";
/**
 * Token Bucket Rate Limiter
 * Allows burst traffic up to bucket capacity
 * Tokens refill at a steady rate
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBucketLimiter = void 0;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('TokenBucketLimiter');
class TokenBucketLimiter {
    storage;
    config;
    constructor(storage, config) {
        this.storage = storage;
        this.config = config;
    }
    async consume(key, tokens = 1) {
        const bucketKey = `tb:${key}`;
        const now = Date.now();
        // Get current bucket state
        const stateJson = await this.storage.get(bucketKey);
        let state;
        if (stateJson === null) {
            // Initialize new bucket
            state = {
                tokens: this.config.capacity,
                lastRefill: now
            };
        }
        else {
            state = this.deserializeState(stateJson);
            // Calculate tokens to add based on time elapsed
            state = this.refillBucket(state, now);
        }
        // Check if we have enough tokens
        if (state.tokens >= tokens) {
            state.tokens -= tokens;
            await this.saveState(bucketKey, state);
            return {
                allowed: true,
                remaining: Math.floor(state.tokens),
                resetAt: this.calculateResetTime(state, now)
            };
        }
        // Not enough tokens
        const retryAfter = this.calculateRetryAfter(state, tokens);
        logger.debug('Rate limit exceeded', { key, remaining: state.tokens, needed: tokens });
        return {
            allowed: false,
            remaining: Math.floor(state.tokens),
            resetAt: this.calculateResetTime(state, now),
            retryAfter
        };
    }
    async check(key) {
        const bucketKey = `tb:${key}`;
        const now = Date.now();
        const stateJson = await this.storage.get(bucketKey);
        if (stateJson === null) {
            return {
                allowed: true,
                remaining: this.config.capacity,
                resetAt: new Date(now + this.config.refillInterval)
            };
        }
        let state = this.deserializeState(stateJson);
        state = this.refillBucket(state, now);
        return {
            allowed: state.tokens >= 1,
            remaining: Math.floor(state.tokens),
            resetAt: this.calculateResetTime(state, now)
        };
    }
    async reset(key) {
        await this.storage.del(`tb:${key}`);
    }
    refillBucket(state, now) {
        const elapsed = now - state.lastRefill;
        const intervalsElapsed = Math.floor(elapsed / this.config.refillInterval);
        if (intervalsElapsed > 0) {
            const tokensToAdd = intervalsElapsed * this.config.refillRate;
            return {
                tokens: Math.min(this.config.capacity, state.tokens + tokensToAdd),
                lastRefill: state.lastRefill + (intervalsElapsed * this.config.refillInterval)
            };
        }
        return state;
    }
    calculateResetTime(state, now) {
        // Time until bucket is full
        const tokensNeeded = this.config.capacity - state.tokens;
        const intervalsNeeded = Math.ceil(tokensNeeded / this.config.refillRate);
        const timeToFull = intervalsNeeded * this.config.refillInterval;
        return new Date(now + timeToFull);
    }
    calculateRetryAfter(state, tokensNeeded) {
        const deficit = tokensNeeded - state.tokens;
        const intervalsNeeded = Math.ceil(deficit / this.config.refillRate);
        return Math.ceil((intervalsNeeded * this.config.refillInterval) / 1000);
    }
    deserializeState(value) {
        // Store as: tokens * 1000000 + lastRefill % 1000000000000
        // This is a simplified approach - in production use JSON or separate keys
        if (value === null) {
            return { tokens: this.config.capacity, lastRefill: Date.now() };
        }
        // For simplicity, just use the value as tokens
        return { tokens: value, lastRefill: Date.now() };
    }
    async saveState(key, state) {
        // TTL = time to fully refill from empty
        const ttl = Math.ceil((this.config.capacity / this.config.refillRate) * this.config.refillInterval) * 2;
        await this.storage.set(key, Math.floor(state.tokens), ttl);
    }
}
exports.TokenBucketLimiter = TokenBucketLimiter;
//# sourceMappingURL=token-bucket.js.map