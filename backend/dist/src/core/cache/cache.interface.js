"use strict";
/**
 * Cache Interface
 * Following Interface Segregation Principle (ISP)
 * Abstracts cache implementation for easy swapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.CachePrefix = void 0;
/**
 * Cache key prefixes for different domains
 */
exports.CachePrefix = {
    MATERIAL: 'material:',
    STOCK: 'stock:',
    ORDER: 'order:',
    OPTIMIZATION: 'opt:',
    SESSION: 'session:',
    RATE_LIMIT: 'ratelimit:',
    USER: 'user:'
};
/**
 * Default TTL values (in seconds)
 */
exports.CacheTTL = {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    SESSION: 86400, // 24 hours
    MATERIAL_LIST: 3600, // 1 hour (rarely changes)
    STOCK_SUMMARY: 300, // 5 minutes (changes often)
    OPTIMIZATION: 900 // 15 minutes
};
//# sourceMappingURL=cache.interface.js.map