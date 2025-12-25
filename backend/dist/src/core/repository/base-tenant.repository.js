"use strict";
/**
 * Base Tenant Repository
 * Abstract base class for tenant-aware repositories
 * Automatically filters queries by tenant context
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTenantRepository = void 0;
exports.getTenantIdForQuery = getTenantIdForQuery;
exports.getTenantIdOptionalForQuery = getTenantIdOptionalForQuery;
const drizzle_orm_1 = require("drizzle-orm");
const tenant_1 = require("../tenant");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('BaseTenantRepository');
// ==================== BASE REPOSITORY ====================
/**
 * Base class for repositories that require tenant isolation.
 * Provides automatic tenant filtering for all queries.
 *
 * @example
 * ```typescript
 * class OrderRepository extends BaseTenantRepository {
 *     constructor(db: Database) {
 *         super(db, 'OrderRepository');
 *     }
 *
 *     async findAll() {
 *         return this.db
 *             .select()
 *             .from(orders)
 *             .where(eq(orders.tenantId, this.getTenantId()));
 *     }
 * }
 * ```
 */
class BaseTenantRepository {
    options;
    db;
    moduleName;
    constructor(db, moduleName, options = {}) {
        this.options = options;
        this.db = db;
        this.moduleName = moduleName;
    }
    /**
     * Get the current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    getTenantId() {
        if (this.options.allowWithoutTenant) {
            const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
            if (!tenantId) {
                logger.warn(`${this.moduleName}: Operating without tenant context`);
            }
            return tenantId ?? '';
        }
        return (0, tenant_1.getCurrentTenantId)();
    }
    /**
     * Get the current tenant ID, returning undefined if not in tenant context.
     */
    getTenantIdOptional() {
        return (0, tenant_1.getCurrentTenantIdOptional)();
    }
    /**
     * Prepare insert data with tenant ID.
     * Automatically adds the current tenant ID to the data.
     */
    withTenantId(data) {
        const tenantId = this.getTenantId();
        return {
            ...data,
            tenantId
        };
    }
    /**
     * Create a raw SQL condition for tenant filtering.
     * Use this when building dynamic queries.
     */
    tenantCondition(column = 'tenant_id') {
        const tenantId = this.getTenantId();
        return (0, drizzle_orm_1.sql) `${drizzle_orm_1.sql.identifier(column)} = ${tenantId}`;
    }
    /**
     * Log a repository operation for debugging.
     */
    logOperation(operation, details) {
        logger.debug(`${this.moduleName}.${operation}`, {
            tenantId: this.getTenantIdOptional(),
            ...details
        });
    }
}
exports.BaseTenantRepository = BaseTenantRepository;
// ==================== UTILITY FUNCTIONS ====================
/**
 * Get tenant ID from context for use in queries.
 * Throws if not in tenant context.
 */
function getTenantIdForQuery() {
    return (0, tenant_1.getCurrentTenantId)();
}
/**
 * Get optional tenant ID from context for use in queries.
 */
function getTenantIdOptionalForQuery() {
    return (0, tenant_1.getCurrentTenantIdOptional)();
}
//# sourceMappingURL=base-tenant.repository.js.map