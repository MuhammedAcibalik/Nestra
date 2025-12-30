"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedBaseRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('BaseRepository');
const tracer = api_1.trace.getTracer('database', '1.0.0');
// Slow query threshold (1 second)
const SLOW_QUERY_THRESHOLD_MS = 1000;
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
class EnhancedBaseRepository {
    db;
    config;
    constructor(db, config = {}) {
        this.db = db;
        this.config = config;
    }
    /** Optional: Get the deletedAt column for soft delete */
    getDeletedAtColumn() {
        return null;
    }
    // ==================== READ OPERATIONS ====================
    /**
     * Find entity by ID
     */
    async findById(id) {
        return this.withTracing('db.query', { operation: 'SELECT', singleResult: true }, async () => {
            const table = this.getTable();
            const where = this.buildWhereWithId(id);
            const results = await this.db.select().from(table).where(where).limit(1);
            return results[0] ?? null;
        });
    }
    /**
     * Find single entity matching conditions
     */
    async findOne(where) {
        return this.withTracing('db.query', { operation: 'SELECT', singleResult: true }, async () => {
            const table = this.getTable();
            const finalWhere = this.applyDefaultFilters(where);
            const results = await this.db.select().from(table).where(finalWhere).limit(1);
            return results[0] ?? null;
        });
    }
    /**
     * Find multiple entities
     */
    async findMany(where, pagination) {
        return this.withTracing('db.query', { operation: 'SELECT', limit: pagination?.limit }, async () => {
            const table = this.getTable();
            const { limit = 100 } = pagination ?? {};
            const finalWhere = this.applyDefaultFilters(where);
            const results = await this.db.select().from(table).where(finalWhere).limit(limit);
            return results;
        });
    }
    /**
     * Find entities with pagination metadata
     */
    async findManyPaginated(where, pagination) {
        const table = this.getTable();
        const { page = 1, limit = 20 } = pagination ?? {};
        const offset = (page - 1) * limit;
        const finalWhere = this.applyDefaultFilters(where);
        const [data, countResult] = await Promise.all([
            this.db.select().from(table).where(finalWhere).limit(limit).offset(offset),
            this.db
                .select({ count: (0, drizzle_orm_1.sql) `count(*)::int` })
                .from(table)
                .where(finalWhere)
        ]);
        const total = countResult[0]?.count ?? 0;
        const totalPages = Math.ceil(total / limit);
        return {
            data: data,
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
    async exists(where) {
        const table = this.getTable();
        const finalWhere = this.applyDefaultFilters(where);
        const result = await this.db
            .select({ exists: (0, drizzle_orm_1.sql) `1` })
            .from(table)
            .where(finalWhere)
            .limit(1);
        return result.length > 0;
    }
    /**
     * Count entities matching conditions
     */
    async count(where) {
        const table = this.getTable();
        const finalWhere = this.applyDefaultFilters(where);
        const result = await this.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)::int` })
            .from(table)
            .where(finalWhere);
        return result[0]?.count ?? 0;
    }
    // ==================== WRITE OPERATIONS ====================
    /**
     * Create a new entity
     */
    async create(data) {
        return this.withTracing('db.insert', { operation: 'INSERT' }, async () => {
            const table = this.getTable();
            const preparedData = this.prepareCreateData(data);
            const [result] = await this.db
                .insert(table)
                .values(preparedData)
                .returning();
            return result;
        });
    }
    /**
     * Create multiple entities
     */
    async createMany(data) {
        if (data.length === 0)
            return [];
        const table = this.getTable();
        const preparedData = data.map((d) => this.prepareCreateData(d));
        const results = await this.db
            .insert(table)
            .values(preparedData)
            .returning();
        return results;
    }
    /**
     * Update entity by ID
     */
    async update(id, data) {
        return this.withTracing('db.update', { operation: 'UPDATE' }, async () => {
            const table = this.getTable();
            const preparedData = this.prepareUpdateData(data);
            const [result] = await this.db
                .update(table)
                .set(preparedData)
                .where((0, drizzle_orm_1.eq)(this.getIdColumn(), id))
                .returning();
            return result;
        });
    }
    /**
     * Update multiple entities matching conditions
     */
    async updateMany(where, data) {
        const table = this.getTable();
        const preparedData = this.prepareUpdateData(data);
        const results = await this.db
            .update(table)
            .set(preparedData)
            .where(where)
            .returning();
        return results.length;
    }
    /**
     * Delete entity by ID (hard delete)
     */
    async delete(id) {
        return this.withTracing('db.delete', { operation: 'DELETE' }, async () => {
            const table = this.getTable();
            await this.db.delete(table).where((0, drizzle_orm_1.eq)(this.getIdColumn(), id));
        });
    }
    /**
     * Delete multiple entities (hard delete)
     */
    async deleteMany(where) {
        const table = this.getTable();
        const results = await this.db.delete(table).where(where).returning();
        return results.length;
    }
    /**
     * Soft delete entity by ID (requires deletedAt column)
     */
    async softDelete(id) {
        if (!this.config.softDelete) {
            throw new Error('Soft delete is not enabled for this repository');
        }
        return this.update(id, { deletedAt: new Date() });
    }
    /**
     * Restore soft-deleted entity
     */
    async restore(id) {
        if (!this.config.softDelete) {
            throw new Error('Soft delete is not enabled for this repository');
        }
        return this.update(id, { deletedAt: null });
    }
    // ==================== TRANSACTION SUPPORT ====================
    /**
     * Execute callback within a transaction
     */
    async transaction(callback) {
        return this.db.transaction(callback);
    }
    // ==================== PROTECTED HELPERS ====================
    /**
     * Build WHERE clause with ID and default filters
     */
    buildWhereWithId(id) {
        const idCondition = (0, drizzle_orm_1.eq)(this.getIdColumn(), id);
        return this.applyDefaultFilters(idCondition);
    }
    /**
     * Apply default filters (e.g., soft delete)
     */
    applyDefaultFilters(where) {
        const conditions = [];
        if (where)
            conditions.push(where);
        // Add soft delete filter if enabled
        if (this.config.softDelete) {
            const deletedAtColumn = this.getDeletedAtColumn();
            if (deletedAtColumn) {
                conditions.push((0, drizzle_orm_1.isNull)(deletedAtColumn));
            }
        }
        if (conditions.length === 0)
            return (0, drizzle_orm_1.sql) `1=1`;
        if (conditions.length === 1)
            return conditions[0];
        return (0, drizzle_orm_1.and)(...conditions);
    }
    /**
     * Prepare data for create operation
     * Override to add defaults (timestamps, etc.)
     */
    prepareCreateData(data) {
        return {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    /**
     * Prepare data for update operation
     * Override to add automatic fields
     */
    prepareUpdateData(data) {
        return {
            ...data,
            updatedAt: new Date()
        };
    }
    // ==================== TRACING HELPERS ====================
    /**
     * Wrap database operation with OpenTelemetry tracing
     */
    async withTracing(spanName, attributes, fn) {
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
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            const startTime = Date.now();
            try {
                const result = await fn();
                const duration = Date.now() - startTime;
                // Record result metrics
                if (Array.isArray(result)) {
                    span.setAttribute('db.operation.rows_returned', result.length);
                }
                else if (attributes.singleResult) {
                    span.setAttribute('db.operation.rows_returned', result ? 1 : 0);
                }
                span.setAttribute('db.operation.duration_ms', duration);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
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
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Database operation failed', {
                    error,
                    table: this.config.tableName,
                    operation: attributes.operation
                });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
}
exports.EnhancedBaseRepository = EnhancedBaseRepository;
//# sourceMappingURL=base.repository.js.map