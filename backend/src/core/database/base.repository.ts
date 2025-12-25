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

import { SQL, eq, sql, and, isNull } from 'drizzle-orm';
import { PgTableWithColumns, PgColumn } from 'drizzle-orm/pg-core';
import { trace, SpanStatusCode, context as otelContext } from '@opentelemetry/api';
import { ATTR_ERROR_TYPE } from '@opentelemetry/semantic-conventions';
import { Database } from '../../db';
import { PaginationOptions, PaginatedResult } from './types';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('BaseRepository');
const tracer = trace.getTracer('database', '1.0.0');

// Slow query threshold (1 second)
const SLOW_QUERY_THRESHOLD_MS = 1000;

// ==================== TYPES ====================

export interface RepositoryConfig {
    /** Enable soft delete (requires deletedAt column) */
    softDelete?: boolean;
    /** Enable OpenTelemetry tracing */
    enableTracing?: boolean;
    /** Table name for tracing attributes */
    tableName?: string;
}

// ==================== BASE REPOSITORY ====================

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
export abstract class EnhancedBaseRepository<
    TEntity extends Record<string, unknown> = Record<string, unknown>,
    TCreate = Partial<TEntity>,
    TUpdate = Partial<TEntity>
> {
    protected readonly db: Database;
    protected readonly config: RepositoryConfig;

    constructor(db: Database, config: RepositoryConfig = {}) {
        this.db = db;
        this.config = config;
    }

    /** Get the Drizzle table reference - must be implemented by subclass */
    protected abstract getTable(): PgTableWithColumns<any>;

    /** Get the ID column - must be implemented by subclass */
    protected abstract getIdColumn(): PgColumn;

    /** Optional: Get the deletedAt column for soft delete */
    protected getDeletedAtColumn(): PgColumn | null {
        return null;
    }

    // ==================== READ OPERATIONS ====================

    /**
     * Find entity by ID
     */
    async findById(id: string): Promise<TEntity | null> {
        return this.withTracing('db.query', { operation: 'SELECT', singleResult: true }, async () => {
            const table = this.getTable();
            const where = this.buildWhereWithId(id);
            const results = await this.db.select().from(table).where(where).limit(1);
            return (results[0] as TEntity) ?? null;
        });
    }

    /**
     * Find single entity matching conditions
     */
    async findOne(where: SQL): Promise<TEntity | null> {
        return this.withTracing('db.query', { operation: 'SELECT', singleResult: true }, async () => {
            const table = this.getTable();
            const finalWhere = this.applyDefaultFilters(where);
            const results = await this.db.select().from(table).where(finalWhere).limit(1);
            return (results[0] as TEntity) ?? null;
        });
    }

    /**
     * Find multiple entities
     */
    async findMany(where?: SQL, pagination?: PaginationOptions): Promise<TEntity[]> {
        return this.withTracing('db.query', { operation: 'SELECT', limit: pagination?.limit }, async () => {
            const table = this.getTable();
            const { limit = 100 } = pagination ?? {};
            const finalWhere = this.applyDefaultFilters(where);

            const results = await this.db.select().from(table).where(finalWhere).limit(limit);

            return results as TEntity[];
        });
    }

    /**
     * Find entities with pagination metadata
     */
    async findManyPaginated(where?: SQL, pagination?: PaginationOptions): Promise<PaginatedResult<TEntity>> {
        const table = this.getTable();
        const { page = 1, limit = 20 } = pagination ?? {};
        const offset = (page - 1) * limit;
        const finalWhere = this.applyDefaultFilters(where);

        const [data, countResult] = await Promise.all([
            this.db.select().from(table).where(finalWhere).limit(limit).offset(offset),
            this.db
                .select({ count: sql<number>`count(*)::int` })
                .from(table)
                .where(finalWhere)
        ]);

        const total = countResult[0]?.count ?? 0;
        const totalPages = Math.ceil(total / limit);

        return {
            data: data as TEntity[],
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }

    /**
     * Check if entity exists
     */
    async exists(where: SQL): Promise<boolean> {
        const table = this.getTable();
        const finalWhere = this.applyDefaultFilters(where);
        const result = await this.db
            .select({ exists: sql<boolean>`1` })
            .from(table)
            .where(finalWhere)
            .limit(1);
        return result.length > 0;
    }

    /**
     * Count entities matching conditions
     */
    async count(where?: SQL): Promise<number> {
        const table = this.getTable();
        const finalWhere = this.applyDefaultFilters(where);
        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(table)
            .where(finalWhere);
        return result[0]?.count ?? 0;
    }

    // ==================== WRITE OPERATIONS ====================

    /**
     * Create a new entity
     */
    async create(data: TCreate): Promise<TEntity> {
        return this.withTracing('db.insert', { operation: 'INSERT' }, async () => {
            const table = this.getTable();
            const preparedData = this.prepareCreateData(data);
            const [result] = await this.db
                .insert(table)
                .values(preparedData as Record<string, unknown>)
                .returning();
            return result as TEntity;
        });
    }

    /**
     * Create multiple entities
     */
    async createMany(data: TCreate[]): Promise<TEntity[]> {
        if (data.length === 0) return [];

        const table = this.getTable();
        const preparedData = data.map((d) => this.prepareCreateData(d));
        const results = await this.db
            .insert(table)
            .values(preparedData as Record<string, unknown>[])
            .returning();
        return results as TEntity[];
    }

    /**
     * Update entity by ID
     */
    async update(id: string, data: TUpdate): Promise<TEntity> {
        return this.withTracing('db.update', { operation: 'UPDATE' }, async () => {
            const table = this.getTable();
            const preparedData = this.prepareUpdateData(data);
            const [result] = await this.db
                .update(table)
                .set(preparedData as Record<string, unknown>)
                .where(eq(this.getIdColumn(), id))
                .returning();
            return result as TEntity;
        });
    }

    /**
     * Update multiple entities matching conditions
     */
    async updateMany(where: SQL, data: TUpdate): Promise<number> {
        const table = this.getTable();
        const preparedData = this.prepareUpdateData(data);
        const results = await this.db
            .update(table)
            .set(preparedData as Record<string, unknown>)
            .where(where)
            .returning();
        return results.length;
    }

    /**
     * Delete entity by ID (hard delete)
     */
    async delete(id: string): Promise<void> {
        return this.withTracing('db.delete', { operation: 'DELETE' }, async () => {
            const table = this.getTable();
            await this.db.delete(table).where(eq(this.getIdColumn(), id));
        });
    }

    /**
     * Delete multiple entities (hard delete)
     */
    async deleteMany(where: SQL): Promise<number> {
        const table = this.getTable();
        const results = await this.db.delete(table).where(where).returning();
        return results.length;
    }

    /**
     * Soft delete entity by ID (requires deletedAt column)
     */
    async softDelete(id: string): Promise<TEntity> {
        if (!this.config.softDelete) {
            throw new Error('Soft delete is not enabled for this repository');
        }
        return this.update(id, { deletedAt: new Date() } as unknown as TUpdate);
    }

    /**
     * Restore soft-deleted entity
     */
    async restore(id: string): Promise<TEntity> {
        if (!this.config.softDelete) {
            throw new Error('Soft delete is not enabled for this repository');
        }
        return this.update(id, { deletedAt: null } as unknown as TUpdate);
    }

    // ==================== TRANSACTION SUPPORT ====================

    /**
     * Execute callback within a transaction
     */
    async transaction<T>(
        callback: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>
    ): Promise<T> {
        return this.db.transaction(callback);
    }

    // ==================== PROTECTED HELPERS ====================

    /**
     * Build WHERE clause with ID and default filters
     */
    protected buildWhereWithId(id: string): SQL {
        const idCondition = eq(this.getIdColumn(), id);
        return this.applyDefaultFilters(idCondition);
    }

    /**
     * Apply default filters (e.g., soft delete)
     */
    protected applyDefaultFilters(where?: SQL): SQL {
        const conditions: SQL[] = [];

        if (where) conditions.push(where);

        // Add soft delete filter if enabled
        if (this.config.softDelete) {
            const deletedAtColumn = this.getDeletedAtColumn();
            if (deletedAtColumn) {
                conditions.push(isNull(deletedAtColumn));
            }
        }

        if (conditions.length === 0) return sql`1=1`;
        if (conditions.length === 1) return conditions[0];
        return and(...conditions)!;
    }

    /**
     * Prepare data for create operation
     * Override to add defaults (timestamps, etc.)
     */
    protected prepareCreateData(data: TCreate): TCreate {
        return {
            ...(data as Record<string, unknown>),
            createdAt: new Date(),
            updatedAt: new Date()
        } as TCreate;
    }

    /**
     * Prepare data for update operation
     * Override to add automatic fields
     */
    protected prepareUpdateData(data: TUpdate): TUpdate {
        return {
            ...(data as Record<string, unknown>),
            updatedAt: new Date()
        } as TUpdate;
    }

    // ==================== TRACING HELPERS ====================

    /**
     * Wrap database operation with OpenTelemetry tracing
     */
    private async withTracing<T>(
        spanName: string,
        attributes: { operation: string; limit?: number; singleResult?: boolean },
        fn: () => Promise<T>
    ): Promise<T> {
        if (!this.config.enableTracing) {
            return fn();
        }

        const span = tracer.startSpan(spanName, {
            attributes: {
                'db.system': 'postgresql',
                'db.operation.name': attributes.operation,
                ...(this.config.tableName && { 'db.collection.name': this.config.tableName }),
                ...(attributes.limit && { 'db.operation.limit': attributes.limit })
            }
        });

        return otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await fn();
                const duration = Date.now() - startTime;

                // Record result metrics
                if (Array.isArray(result)) {
                    span.setAttribute('db.operation.rows_returned', result.length);
                } else if (attributes.singleResult) {
                    span.setAttribute('db.operation.rows_returned', result ? 1 : 0);
                }

                span.setAttribute('db.operation.duration_ms', duration);
                span.setStatus({ code: SpanStatusCode.OK });

                // Detect slow queries
                if (duration > SLOW_QUERY_THRESHOLD_MS) {
                    logger.warn('Slow database query detected', {
                        table: this.config.tableName,
                        operation: attributes.operation,
                        duration,
                        threshold: SLOW_QUERY_THRESHOLD_MS
                    });
                    span.addEvent('slow_query', {
                        'db.slow_query.threshold_ms': SLOW_QUERY_THRESHOLD_MS,
                        'db.slow_query.actual_ms': duration
                    });
                }

                return result;
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });

                if (error instanceof Error) {
                    span.setAttribute(ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }

                logger.error('Database operation failed', {
                    error,
                    table: this.config.tableName,
                    operation: attributes.operation
                });

                throw error;
            } finally {
                span.end();
            }
        });
    }
}
