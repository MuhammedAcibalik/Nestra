/**
 * Enhanced Base Repository
 * Abstract base class for all repositories using Drizzle ORM
 *
 * Features:
 * - Type-safe CRUD operations
 * - Pagination with metadata
 * - Transaction support
 * - Designed to work with existing repository pattern
 */
import { SQL } from 'drizzle-orm';
import { PgTableWithColumns, PgColumn } from 'drizzle-orm/pg-core';
import { Database } from '../../db';
import { PaginationOptions, PaginatedResult } from './types';
export interface RepositoryConfig {
    /** Enable soft delete (requires deletedAt column) */
    softDelete?: boolean;
}
/**
 * Abstract base repository providing common CRUD operations.
 * Designed to work alongside existing repository implementations.
 *
 * @example
 * ```typescript
 * class ProductRepository extends EnhancedBaseRepository {
 *     protected readonly tableName = 'products';
 *
 *     protected getTable() {
 *         return products;
 *     }
 *
 *     protected getIdColumn() {
 *         return products.id;
 *     }
 * }
 * ```
 */
export declare abstract class EnhancedBaseRepository<TEntity extends Record<string, unknown> = Record<string, unknown>, TCreate = Partial<TEntity>, TUpdate = Partial<TEntity>> {
    protected readonly db: Database;
    protected readonly config: RepositoryConfig;
    constructor(db: Database, config?: RepositoryConfig);
    /** Get the Drizzle table reference - must be implemented by subclass */
    protected abstract getTable(): PgTableWithColumns<any>;
    /** Get the ID column - must be implemented by subclass */
    protected abstract getIdColumn(): PgColumn;
    /** Optional: Get the deletedAt column for soft delete */
    protected getDeletedAtColumn(): PgColumn | null;
    /**
     * Find entity by ID
     */
    findById(id: string): Promise<TEntity | null>;
    /**
     * Find single entity matching conditions
     */
    findOne(where: SQL): Promise<TEntity | null>;
    /**
     * Find multiple entities
     */
    findMany(where?: SQL, pagination?: PaginationOptions): Promise<TEntity[]>;
    /**
     * Find entities with pagination metadata
     */
    findManyPaginated(where?: SQL, pagination?: PaginationOptions): Promise<PaginatedResult<TEntity>>;
    /**
     * Check if entity exists
     */
    exists(where: SQL): Promise<boolean>;
    /**
     * Count entities matching conditions
     */
    count(where?: SQL): Promise<number>;
    /**
     * Create a new entity
     */
    create(data: TCreate): Promise<TEntity>;
    /**
     * Create multiple entities
     */
    createMany(data: TCreate[]): Promise<TEntity[]>;
    /**
     * Update entity by ID
     */
    update(id: string, data: TUpdate): Promise<TEntity>;
    /**
     * Update multiple entities matching conditions
     */
    updateMany(where: SQL, data: TUpdate): Promise<number>;
    /**
     * Delete entity by ID (hard delete)
     */
    delete(id: string): Promise<void>;
    /**
     * Delete multiple entities (hard delete)
     */
    deleteMany(where: SQL): Promise<number>;
    /**
     * Soft delete entity by ID (requires deletedAt column)
     */
    softDelete(id: string): Promise<TEntity>;
    /**
     * Restore soft-deleted entity
     */
    restore(id: string): Promise<TEntity>;
    /**
     * Execute callback within a transaction
     */
    transaction<T>(callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>): Promise<T>;
    /**
     * Build WHERE clause with ID and default filters
     */
    protected buildWhereWithId(id: string): SQL;
    /**
     * Apply default filters (e.g., soft delete)
     */
    protected applyDefaultFilters(where?: SQL): SQL;
    /**
     * Prepare data for create operation
     * Override to add defaults (timestamps, etc.)
     */
    protected prepareCreateData(data: TCreate): TCreate;
    /**
     * Prepare data for update operation
     * Override to add automatic fields
     */
    protected prepareUpdateData(data: TUpdate): TUpdate;
}
//# sourceMappingURL=base.repository.d.ts.map