"use strict";
/**
 * Transaction Utilities
 * Helpers for database transaction management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
exports.batchTransaction = batchTransaction;
exports.withRetry = withRetry;
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('Transaction');
// ==================== TRANSACTION HELPERS ====================
/**
 * Execute a callback within a database transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @example
 * ```typescript
 * const result = await withTransaction(db, async (tx) => {
 *     const order = await tx.insert(orders).values(data).returning();
 *     await tx.insert(orderItems).values(items);
 *     return order[0];
 * });
 * ```
 */
async function withTransaction(db, callback, _options) {
    return db.transaction(async (tx) => {
        try {
            const result = await callback(tx);
            logger.debug('Transaction committed successfully');
            return result;
        }
        catch (error) {
            logger.error('Transaction failed, rolling back', { error });
            throw error;
        }
    });
}
/**
 * Execute multiple operations in a single transaction.
 * All operations must succeed or all will be rolled back.
 *
 * @example
 * ```typescript
 * await batchTransaction(db, [
 *     (tx) => tx.insert(orders).values(order1),
 *     (tx) => tx.insert(orders).values(order2),
 *     (tx) => tx.insert(orderItems).values(items),
 * ]);
 * ```
 */
async function batchTransaction(db, operations) {
    return db.transaction(async (tx) => {
        const results = [];
        for (const operation of operations) {
            results.push(await operation(tx));
        }
        return results;
    });
}
/**
 * Retry a transaction on conflict or deadlock.
 * Useful for high-concurrency scenarios.
 */
async function withRetry(db, callback, maxRetries = 3, delayMs = 100) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await withTransaction(db, callback);
        }
        catch (error) {
            lastError = error;
            const isRetryable = isRetryableError(error);
            if (!isRetryable || attempt === maxRetries) {
                logger.error('Transaction failed after retries', {
                    attempt,
                    maxRetries,
                    error: lastError.message
                });
                throw lastError;
            }
            logger.warn('Transaction failed, retrying', {
                attempt,
                maxRetries,
                delay: delayMs * attempt
            });
            await sleep(delayMs * attempt);
        }
    }
    throw lastError;
}
// ==================== INTERNAL HELPERS ====================
function isRetryableError(error) {
    if (!(error instanceof Error))
        return false;
    const retryablePatterns = [
        'deadlock',
        'serialization failure',
        'could not serialize',
        'concurrent update',
        'lock timeout'
    ];
    const message = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => message.includes(pattern));
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=transaction.js.map