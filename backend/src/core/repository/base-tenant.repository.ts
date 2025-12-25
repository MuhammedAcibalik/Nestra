/**
 * Base Tenant Repository
 * Abstract base class for tenant-aware repositories
 * Automatically filters queries by tenant context
 */

import { sql, SQL } from 'drizzle-orm';
import { Database } from '../../db';
import { getCurrentTenantId, getCurrentTenantIdOptional } from '../tenant';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('BaseTenantRepository');

// ==================== INTERFACES ====================

export interface ITenantRepositoryOptions {
    /**
     * If true, tenant filter is optional and operations work without tenant context
     * Useful for system-level queries or background jobs
     */
    readonly allowWithoutTenant?: boolean;
}

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
export abstract class BaseTenantRepository {
    protected readonly db: Database;
    protected readonly moduleName: string;

    constructor(
        db: Database,
        moduleName: string,
        protected readonly options: ITenantRepositoryOptions = {}
    ) {
        this.db = db;
        this.moduleName = moduleName;
    }

    /**
     * Get the current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    protected getTenantId(): string {
        if (this.options.allowWithoutTenant) {
            const tenantId = getCurrentTenantIdOptional();
            if (!tenantId) {
                logger.warn(`${this.moduleName}: Operating without tenant context`);
            }
            return tenantId ?? '';
        }
        return getCurrentTenantId();
    }

    /**
     * Get the current tenant ID, returning undefined if not in tenant context.
     */
    protected getTenantIdOptional(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    /**
     * Prepare insert data with tenant ID.
     * Automatically adds the current tenant ID to the data.
     */
    protected withTenantId<D extends Record<string, unknown>>(data: D): D & { tenantId: string } {
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
    protected tenantCondition(column: string = 'tenant_id'): SQL<unknown> {
        const tenantId = this.getTenantId();
        return sql`${sql.identifier(column)} = ${tenantId}`;
    }

    /**
     * Log a repository operation for debugging.
     */
    protected logOperation(operation: string, details?: Record<string, unknown>): void {
        logger.debug(`${this.moduleName}.${operation}`, {
            tenantId: this.getTenantIdOptional(),
            ...details
        });
    }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get tenant ID from context for use in queries.
 * Throws if not in tenant context.
 */
export function getTenantIdForQuery(): string {
    return getCurrentTenantId();
}

/**
 * Get optional tenant ID from context for use in queries.
 */
export function getTenantIdOptionalForQuery(): string | undefined {
    return getCurrentTenantIdOptional();
}
