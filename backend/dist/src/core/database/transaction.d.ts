/**
 * Transaction Utilities
 * Helpers for database transaction management
 */
import { Database } from '../../db';
export type TransactionCallback<T, TxType = unknown> = (tx: TxType) => Promise<T>;
export interface TransactionOptions {
    /** Isolation level for the transaction */
    isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
    /** Timeout in milliseconds */
    timeout?: number;
}
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
export declare function withTransaction<T>(db: Database, callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>, _options?: TransactionOptions): Promise<T>;
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
export declare function batchTransaction<T extends unknown[]>(db: Database, operations: ((tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<unknown>)[]): Promise<T>;
/**
 * Retry a transaction on conflict or deadlock.
 * Useful for high-concurrency scenarios.
 */
export declare function withRetry<T>(db: Database, callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>, maxRetries?: number, delayMs?: number): Promise<T>;
//# sourceMappingURL=transaction.d.ts.map