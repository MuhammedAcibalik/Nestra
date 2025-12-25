/**
 * Base Tenant Repository
 * Abstract base class for tenant-aware repositories
 * Automatically filters queries by tenant context
 */
import { SQL } from 'drizzle-orm';
import { Database } from '../../db';
export interface ITenantRepositoryOptions {
    /**
     * If true, tenant filter is optional and operations work without tenant context
     * Useful for system-level queries or background jobs
     */
    readonly allowWithoutTenant?: boolean;
}
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
export declare abstract class BaseTenantRepository {
    protected readonly options: ITenantRepositoryOptions;
    protected readonly db: Database;
    protected readonly moduleName: string;
    constructor(db: Database, moduleName: string, options?: ITenantRepositoryOptions);
    /**
     * Get the current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    protected getTenantId(): string;
    /**
     * Get the current tenant ID, returning undefined if not in tenant context.
     */
    protected getTenantIdOptional(): string | undefined;
    /**
     * Prepare insert data with tenant ID.
     * Automatically adds the current tenant ID to the data.
     */
    protected withTenantId<D extends Record<string, unknown>>(data: D): D & {
        tenantId: string;
    };
    /**
     * Create a raw SQL condition for tenant filtering.
     * Use this when building dynamic queries.
     */
    protected tenantCondition(column?: string): SQL<unknown>;
    /**
     * Log a repository operation for debugging.
     */
    protected logOperation(operation: string, details?: Record<string, unknown>): void;
}
/**
 * Get tenant ID from context for use in queries.
 * Throws if not in tenant context.
 */
export declare function getTenantIdForQuery(): string;
/**
 * Get optional tenant ID from context for use in queries.
 */
export declare function getTenantIdOptionalForQuery(): string | undefined;
//# sourceMappingURL=base-tenant.repository.d.ts.map