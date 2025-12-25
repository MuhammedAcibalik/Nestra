/**
 * Tenant-Aware Repository
 * Base class for repositories requiring multi-tenant isolation
 *
 * Features:
 * - Automatic tenant filtering on all queries
 * - Automatic tenant ID injection on create
 * - Tenant ownership verification on update/delete
 */
import { SQL } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Database } from '../../db';
import { EnhancedBaseRepository, RepositoryConfig } from './base.repository';
import { PaginationOptions } from './types';
export interface TenantRepositoryConfig extends RepositoryConfig {
    /**
     * Allow operations without tenant context.
     * Useful for system-level queries or background jobs.
     */
    allowWithoutTenant?: boolean;
}
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
export declare abstract class TenantAwareRepository<TEntity extends Record<string, unknown> & {
    tenantId?: string | null;
} = Record<string, unknown> & {
    tenantId?: string | null;
}, TCreate = Partial<TEntity>, TUpdate = Partial<TEntity>> extends EnhancedBaseRepository<TEntity, TCreate, TUpdate> {
    protected readonly tenantConfig: TenantRepositoryConfig;
    constructor(db: Database, config?: TenantRepositoryConfig);
    /** Get the tenant ID column - must be implemented by subclass */
    protected abstract getTenantIdColumn(): PgColumn;
    /**
     * Get current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    protected getTenantId(): string;
    /**
     * Get tenant ID without throwing
     */
    protected getTenantIdOptional(): string | undefined;
    /**
     * Check if currently in tenant context
     */
    protected hasTenantContext(): boolean;
    /**
     * Create tenant filter condition
     */
    protected tenantFilter(): SQL | undefined;
    /**
     * Combine tenant filter with additional conditions
     */
    protected withTenantFilter(where?: SQL): SQL;
    /**
     * Add tenant ID to data object
     */
    protected withTenantId<D extends Record<string, unknown>>(data: D): D & {
        tenantId: string;
    };
    /**
     * Apply tenant filter to default filters
     */
    protected applyDefaultFilters(where?: SQL): SQL;
    /**
     * Prepare create data with tenant ID
     */
    protected prepareCreateData(data: TCreate): TCreate;
    /**
     * Update with tenant ownership verification
     */
    update(id: string, data: TUpdate): Promise<TEntity>;
    /**
     * Delete with tenant ownership verification
     */
    delete(id: string): Promise<void>;
    /**
     * Find all entities for current tenant
     */
    findAllForTenant(pagination?: PaginationOptions): Promise<TEntity[]>;
    /**
     * Count entities for current tenant
     */
    countForTenant(): Promise<number>;
    /**
     * Check if entity belongs to current tenant
     */
    belongsToTenant(id: string): Promise<boolean>;
    /**
     * Find entity by ID ignoring tenant filter.
     * Use with caution - only for admin/system operations.
     */
    findByIdCrossTenant(id: string): Promise<TEntity | null>;
    /**
     * Find all entities across all tenants.
     * Use with caution - only for admin/system operations.
     */
    findAllCrossTenant(where?: SQL, pagination?: PaginationOptions): Promise<TEntity[]>;
}
//# sourceMappingURL=tenant.repository.d.ts.map