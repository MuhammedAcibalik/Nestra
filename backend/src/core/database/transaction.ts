/**
 * Transaction Utilities
 * Helpers for database transaction management
 */

import { Database } from '../../db';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('Transaction');

// ==================== TYPES ====================

// Use generic transaction type for Drizzle compatibility
export type TransactionCallback<T, TxType = unknown> = (tx: TxType) => Promise<T>;

export interface TransactionOptions {
    /** Isolation level for the transaction */
    isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
    /** Timeout in milliseconds */
    timeout?: number;
}

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
export async function withTransaction<T>(
    db: Database,
    callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>,
    _options?: TransactionOptions
): Promise<T> {
    return db.transaction(async (tx) => {
        try {
            const result = await callback(tx);
            logger.debug('Transaction committed successfully');
            return result;
        } catch (error) {
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
export async function batchTransaction<T extends unknown[]>(
    db: Database,
    operations: ((tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<unknown>)[]
): Promise<T> {
    return db.transaction(async (tx) => {
        const results: unknown[] = [];
        for (const operation of operations) {
            results.push(await operation(tx));
        }
        return results as T;
    });
}

/**
 * Retry a transaction on conflict or deadlock.
 * Useful for high-concurrency scenarios.
 */
export async function withRetry<T>(
    db: Database,
    callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>,
    maxRetries = 3,
    delayMs = 100
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await withTransaction(db, callback);
        } catch (error) {
            lastError = error as Error;
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

function isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

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

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
