"use strict";
/**
 * Enhanced Base Repository with OpenTelemetry Tracing
 * Example implementation using semantic conventions for database operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedBaseRepository = void 0;
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('BaseRepository');
const tracer = api_1.trace.getTracer('database', '1.0.0');
// ==================== ENHANCED BASE REPOSITORY ====================
class EnhancedBaseRepository {
    config;
    db;
    tableName;
    enableTracing;
    constructor(db, config) {
        this.config = config;
        this.db = db;
        this.tableName = config.tableName;
        this.enableTracing = config.enableTracing ?? true;
    }
    /**
     * Find many with tracing
     */
    async findMany(filter, limit, offset) {
        if (!this.enableTracing) {
            return this.findManyImpl(filter, limit, offset);
        }
        const span = tracer.startSpan('db.query', {
            attributes: {
                [semantic_conventions_1.ATTR_DB_SYSTEM]: 'postgresql',
                [semantic_conventions_1.ATTR_DB_OPERATION_NAME]: 'SELECT',
                [semantic_conventions_1.ATTR_DB_NAME]: 'nestra',
                'db.table': this.tableName,
                'db.sql.table': this.tableName,
                ...(filter && { 'db.operation.filter_count': Object.keys(filter).length }),
                ...(limit && { 'db.operation.limit': limit }),
                ...(offset && { 'db.operation.offset': offset })
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            try {
                const startTime = Date.now();
                const result = await this.findManyImpl(filter, limit, offset);
                const duration = Date.now() - startTime;
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.setAttribute('db.operation.rows_returned', result.length);
                span.setAttribute('db.operation.duration_ms', duration);
                if (duration > 1000) {
                    logger.warn('Slow query detected', {
                        table: this.tableName,
                        duration,
                        rowCount: result.length
                    });
                    span.addEvent('slow_query', {
                        'db.slow_query.threshold_ms': 1000,
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
                logger.error('Query failed', { error, table: this.tableName });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Create with tracing
     */
    async create(data) {
        if (!this.enableTracing) {
            return this.createImpl(data);
        }
        const span = tracer.startSpan('db.insert', {
            attributes: {
                [semantic_conventions_1.ATTR_DB_SYSTEM]: 'postgresql',
                [semantic_conventions_1.ATTR_DB_OPERATION_NAME]: 'INSERT',
                [semantic_conventions_1.ATTR_DB_NAME]: 'nestra',
                'db.table': this.tableName,
                'db.sql.table': this.tableName
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            try {
                const result = await this.createImpl(data);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.setAttribute('db.operation.rows_affected', 1);
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
                    // Check for specific database errors
                    if (error.message.includes('duplicate key')) {
                        span.addEvent('db.constraint_violation', {
                            'db.constraint.type': 'unique'
                        });
                    }
                }
                logger.error('Insert failed', { error, table: this.tableName });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Update with tracing
     */
    async update(id, data) {
        if (!this.enableTracing) {
            return this.updateImpl(id, data);
        }
        const span = tracer.startSpan('db.update', {
            attributes: {
                [semantic_conventions_1.ATTR_DB_SYSTEM]: 'postgresql',
                [semantic_conventions_1.ATTR_DB_OPERATION_NAME]: 'UPDATE',
                [semantic_conventions_1.ATTR_DB_NAME]: 'nestra',
                'db.table': this.tableName,
                'db.sql.table': this.tableName,
                'db.operation.update_fields': Object.keys(data).length
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            try {
                const result = await this.updateImpl(id, data);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.setAttribute('db.operation.rows_affected', 1);
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
                logger.error('Update failed', { error, table: this.tableName, id });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Delete with tracing
     */
    async delete(id) {
        if (!this.enableTracing) {
            return this.deleteImpl(id);
        }
        const span = tracer.startSpan('db.delete', {
            attributes: {
                [semantic_conventions_1.ATTR_DB_SYSTEM]: 'postgresql',
                [semantic_conventions_1.ATTR_DB_OPERATION_NAME]: 'DELETE',
                [semantic_conventions_1.ATTR_DB_NAME]: 'nestra',
                'db.table': this.tableName,
                'db.sql.table': this.tableName
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
            try {
                await this.deleteImpl(id);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                span.setAttribute('db.operation.rows_affected', 1);
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
                logger.error('Delete failed', { error, table: this.tableName, id });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
}
exports.EnhancedBaseRepository = EnhancedBaseRepository;
//# sourceMappingURL=base.repository.enhanced.example.js.map