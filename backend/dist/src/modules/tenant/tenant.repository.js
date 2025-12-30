"use strict";
/**
 * Tenant Repository
 * Data access layer for tenant management
 * Following Repository Pattern with Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/schema");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('TenantRepository');
// ==================== REPOSITORY ====================
class TenantRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT CRUD ====================
    async findById(id) {
        const result = await this.db.query.tenants.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.tenants.id, id)
        });
        return result ?? null;
    }
    async findBySlug(slug) {
        const result = await this.db.query.tenants.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.tenants.slug, slug)
        });
        return result ?? null;
    }
    async findAll(options = {}) {
        const conditions = [];
        if (options.isActive !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tenants.isActive, options.isActive));
        }
        if (options.plan) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tenants.plan, options.plan));
        }
        if (options.search) {
            conditions.push((0, drizzle_orm_1.like)(schema_1.tenants.name, `%${options.search}%`));
        }
        const query = this.db
            .select()
            .from(schema_1.tenants)
            .limit(options.limit ?? 100)
            .offset(options.offset ?? 0);
        if (conditions.length > 0) {
            return query.where((0, drizzle_orm_1.and)(...conditions));
        }
        return query;
    }
    async create(data) {
        const [result] = await this.db.insert(schema_1.tenants).values(data).returning();
        logger.info('Tenant created', { id: result.id, slug: result.slug });
        return result;
    }
    async update(id, data) {
        const [result] = await this.db
            .update(schema_1.tenants)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id))
            .returning();
        if (result) {
            logger.info('Tenant updated', { id: result.id });
        }
        return result ?? null;
    }
    async delete(id) {
        const result = await this.db.delete(schema_1.tenants).where((0, drizzle_orm_1.eq)(schema_1.tenants.id, id)).returning({ id: schema_1.tenants.id });
        if (result.length > 0) {
            logger.info('Tenant deleted', { id });
            return true;
        }
        return false;
    }
    // ==================== TENANT USERS ====================
    async addUserToTenant(data) {
        const [result] = await this.db.insert(schema_1.tenantUsers).values(data).returning();
        logger.info('User added to tenant', {
            userId: result.userId,
            tenantId: result.tenantId
        });
        return result;
    }
    async removeUserFromTenant(tenantId, userId) {
        const result = await this.db
            .delete(schema_1.tenantUsers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tenantUsers.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.tenantUsers.userId, userId)))
            .returning({ id: schema_1.tenantUsers.id });
        if (result.length > 0) {
            logger.info('User removed from tenant', { userId, tenantId });
            return true;
        }
        return false;
    }
    async getUserTenants(userId) {
        return this.db.query.tenantUsers.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.tenantUsers.userId, userId),
            with: {
                tenant: true
            }
        });
    }
    async getTenantUsers(tenantId) {
        return this.db.query.tenantUsers.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.tenantUsers.tenantId, tenantId)
        });
    }
    async isUserInTenant(userId, tenantId) {
        const result = await this.db.query.tenantUsers.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tenantUsers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tenantUsers.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.tenantUsers.isActive, true))
        });
        return result !== undefined;
    }
    // ==================== STATS ====================
    async getUserCount(tenantId) {
        const users = await this.db.query.tenantUsers.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tenantUsers.tenantId, tenantId), (0, drizzle_orm_1.eq)(schema_1.tenantUsers.isActive, true))
        });
        return users.length;
    }
}
exports.TenantRepository = TenantRepository;
//# sourceMappingURL=tenant.repository.js.map