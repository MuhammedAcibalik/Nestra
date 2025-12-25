"use strict";
/**
 * Tenant-Aware Repository
 * Base class for repositories requiring multi-tenant isolation
 *
 * Features:
 * - Automatic tenant filtering on all queries
 * - Automatic tenant ID injection on create
 * - Tenant ownership verification on update/delete
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantAwareRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const base_repository_1 = require("./base.repository");
const tenant_1 = require("../tenant");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('TenantRepository');
// ==================== TENANT-AWARE REPOSITORY ====================
/**
 * Abstract base repository for multi-tenant entities.
 * Automatically filters all queries by current tenant context.
 *
 * @example
 * ```typescript
 * class OrderRepository extends TenantAwareRepository {
 *     protected getTable() { return orders; }
 *     protected getIdColumn() { return orders.id; }
 *     protected getTenantIdColumn() { return orders.tenantId; }
 * }
 * ```
 */
class TenantAwareRepository extends base_repository_1.EnhancedBaseRepository {
    tenantConfig;
    constructor(db, config = {}) {
        super(db, config);
        this.tenantConfig = config;
    }
    // ==================== TENANT CONTEXT ====================
    /**
     * Get current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    getTenantId() {
        if (this.tenantConfig.allowWithoutTenant) {
            const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
            if (!tenantId) {
                logger.warn('Operating without tenant context');
            }
            return tenantId ?? '';
        }
        return (0, tenant_1.getCurrentTenantId)();
    }
    /**
     * Get tenant ID without throwing
     */
    getTenantIdOptional() {
        return (0, tenant_1.getCurrentTenantIdOptional)();
    }
    /**
     * Check if currently in tenant context
     */
    hasTenantContext() {
        return !!(0, tenant_1.getCurrentTenantIdOptional)();
    }
    // ==================== TENANT FILTERING ====================
    /**
     * Create tenant filter condition
     */
    tenantFilter() {
        const tenantId = this.tenantConfig.allowWithoutTenant
            ? this.getTenantIdOptional()
            : this.getTenantId();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(this.getTenantIdColumn(), tenantId);
    }
    /**
     * Combine tenant filter with additional conditions
     */
    withTenantFilter(where) {
        const tenantCondition = this.tenantFilter();
        if (!tenantCondition)
            return where ?? (0, drizzle_orm_1.sql) `1=1`;
        if (!where)
            return tenantCondition;
        return (0, drizzle_orm_1.and)(tenantCondition, where);
    }
    /**
     * Add tenant ID to data object
     */
    withTenantId(data) {
        return {
            ...data,
            tenantId: this.getTenantId()
        };
    }
    // ==================== OVERRIDDEN METHODS ====================
    /**
     * Apply tenant filter to default filters
     */
    applyDefaultFilters(where) {
        const baseFilters = super.applyDefaultFilters(where);
        return this.withTenantFilter(baseFilters);
    }
    /**
     * Prepare create data with tenant ID
     */
    prepareCreateData(data) {
        const baseData = super.prepareCreateData(data);
        return this.withTenantId(baseData);
    }
    /**
     * Update with tenant ownership verification
     */
    async update(id, data) {
        // Verify tenant ownership before update
        const exists = await this.exists((0, drizzle_orm_1.eq)(this.getIdColumn(), id));
        if (!exists) {
            throw new Error('Entity not found or access denied');
        }
        return super.update(id, data);
    }
    /**
     * Delete with tenant ownership verification
     */
    async delete(id) {
        const table = this.getTable();
        await this.db
            .delete(table)
            .where(this.withTenantFilter((0, drizzle_orm_1.eq)(this.getIdColumn(), id)));
    }
    // ==================== TENANT-SPECIFIC METHODS ====================
    /**
     * Find all entities for current tenant
     */
    async findAllForTenant(pagination) {
        return this.findMany(undefined, pagination);
    }
    /**
     * Count entities for current tenant
     */
    async countForTenant() {
        return this.count();
    }
    /**
     * Check if entity belongs to current tenant
     */
    async belongsToTenant(id) {
        return this.exists((0, drizzle_orm_1.eq)(this.getIdColumn(), id));
    }
    // ==================== CROSS-TENANT METHODS (ADMIN ONLY) ====================
    /**
     * Find entity by ID ignoring tenant filter.
     * Use with caution - only for admin/system operations.
     */
    async findByIdCrossTenant(id) {
        const table = this.getTable();
        const results = await this.db
            .select()
            .from(table)
            .where((0, drizzle_orm_1.eq)(this.getIdColumn(), id))
            .limit(1);
        return results[0] ?? null;
    }
    /**
     * Find all entities across all tenants.
     * Use with caution - only for admin/system operations.
     */
    async findAllCrossTenant(where, pagination) {
        const table = this.getTable();
        const { limit = 100 } = pagination ?? {};
        const finalWhere = where ?? (0, drizzle_orm_1.sql) `1=1`;
        const results = await this.db
            .select()
            .from(table)
            .where(finalWhere)
            .limit(limit);
        return results;
    }
}
exports.TenantAwareRepository = TenantAwareRepository;
//# sourceMappingURL=tenant.repository.js.map