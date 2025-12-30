"use strict";
/**
 * Audit Repository
 * Database operations for audit logs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('AuditRepository');
// ==================== REPOSITORY ====================
class AuditRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(data) {
        try {
            const [result] = await this.db.insert(schema_1.auditLogs).values(data).returning();
            return result;
        }
        catch (error) {
            logger.error('Failed to create audit log', { error, entityType: data.entityType });
            throw error;
        }
    }
    async findById(id) {
        const result = await this.db.query.auditLogs.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.auditLogs.id, id),
            with: {
                user: true
            }
        });
        return result ?? null;
    }
    async findMany(options) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.auditLogs.tenantId, options.tenantId)];
        if (options.entityType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, options.entityType));
        }
        if (options.entityId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, options.entityId));
        }
        if (options.userId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.userId, options.userId));
        }
        if (options.action) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.action, options.action));
        }
        if (options.module) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.auditLogs.module, options.module));
        }
        if (options.startDate && options.endDate) {
            conditions.push((0, drizzle_orm_1.between)(schema_1.auditLogs.createdAt, options.startDate, options.endDate));
        }
        return this.db.query.auditLogs.findMany({
            where: (0, drizzle_orm_1.and)(...conditions),
            with: {
                user: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.auditLogs.createdAt)],
            limit: options.limit ?? 50,
            offset: options.offset ?? 0
        });
    }
    async countByEntity(tenantId, entityType, entityId) {
        const result = await this.db
            .select()
            .from(schema_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, entityType), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, entityId)));
        return result.length;
    }
    async getEntityHistory(tenantId, entityType, entityId, limit = 20) {
        return this.db.query.auditLogs.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityType, entityType), (0, drizzle_orm_1.eq)(schema_1.auditLogs.entityId, entityId)),
            with: {
                user: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.auditLogs.createdAt)],
            limit
        });
    }
    async deleteOlderThan(tenantId, days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const result = await this.db
            .delete(schema_1.auditLogs)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.auditLogs.tenantId, tenantId), (0, drizzle_orm_1.between)(schema_1.auditLogs.createdAt, new Date(0), cutoffDate)))
            .returning();
        logger.info('Deleted old audit logs', { tenantId, days, count: result.length });
        return result.length;
    }
}
exports.AuditRepository = AuditRepository;
//# sourceMappingURL=audit.repository.js.map