/**
 * Tenant-Aware Repository
 * Base class for repositories requiring multi-tenant isolation
 *
 * Features:
 * - Automatic tenant filtering on all queries
 * - Automatic tenant ID injection on create
 * - Tenant ownership verification on update/delete
 */

import { SQL, eq, and, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';
import { Database } from '../../db';
import { EnhancedBaseRepository, RepositoryConfig } from './base.repository';
import { PaginationOptions } from './types';
import { getCurrentTenantId, getCurrentTenantIdOptional } from '../tenant';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('TenantRepository');

// ==================== TYPES ====================

export interface TenantRepositoryConfig extends RepositoryConfig {
    /**
     * Allow operations without tenant context.
     * Useful for system-level queries or background jobs.
     */
    allowWithoutTenant?: boolean;
}

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
export abstract class TenantAwareRepository<
    TEntity extends Record<string, unknown> & { tenantId?: string | null } = Record<string, unknown> & {
        tenantId?: string | null;
    },
    TCreate = Partial<TEntity>,
    TUpdate = Partial<TEntity>
> extends EnhancedBaseRepository<TEntity, TCreate, TUpdate> {
    protected readonly tenantConfig: TenantRepositoryConfig;

    constructor(db: Database, config: TenantRepositoryConfig = {}) {
        super(db, config);
        this.tenantConfig = config;
    }

    /** Get the tenant ID column - must be implemented by subclass */
    protected abstract getTenantIdColumn(): PgColumn;

    // ==================== TENANT CONTEXT ====================

    /**
     * Get current tenant ID from context.
     * Throws if not in tenant context and allowWithoutTenant is false.
     */
    protected getTenantId(): string {
        if (this.tenantConfig.allowWithoutTenant) {
            const tenantId = getCurrentTenantIdOptional();
            if (!tenantId) {
                logger.warn('Operating without tenant context');
            }
            return tenantId ?? '';
        }
        return getCurrentTenantId();
    }

    /**
     * Get tenant ID without throwing
     */
    protected getTenantIdOptional(): string | undefined {
        return getCurrentTenantIdOptional();
    }

    /**
     * Check if currently in tenant context
     */
    protected hasTenantContext(): boolean {
        return !!getCurrentTenantIdOptional();
    }

    // ==================== TENANT FILTERING ====================

    /**
     * Create tenant filter condition
     */
    protected tenantFilter(): SQL | undefined {
        const tenantId = this.tenantConfig.allowWithoutTenant ? this.getTenantIdOptional() : this.getTenantId();

        if (!tenantId) return undefined;
        return eq(this.getTenantIdColumn(), tenantId);
    }

    /**
     * Combine tenant filter with additional conditions
     */
    protected withTenantFilter(where?: SQL): SQL {
        const tenantCondition = this.tenantFilter();

        if (!tenantCondition) return where ?? sql`1=1`;
        if (!where) return tenantCondition;

        return and(tenantCondition, where)!;
    }

    /**
     * Add tenant ID to data object
     */
    protected withTenantId<D extends Record<string, unknown>>(data: D): D & { tenantId: string } {
        return {
            ...data,
            tenantId: this.getTenantId()
        };
    }

    // ==================== OVERRIDDEN METHODS ====================

    /**
     * Apply tenant filter to default filters
     */
    protected override applyDefaultFilters(where?: SQL): SQL {
        const baseFilters = super.applyDefaultFilters(where);
        return this.withTenantFilter(baseFilters);
    }

    /**
     * Prepare create data with tenant ID
     */
    protected override prepareCreateData(data: TCreate): TCreate {
        const baseData = super.prepareCreateData(data);
        return this.withTenantId(baseData as Record<string, unknown>) as TCreate;
    }

    /**
     * Update with tenant ownership verification
     */
    override async update(id: string, data: TUpdate): Promise<TEntity> {
        // Verify tenant ownership before update
        const exists = await this.exists(eq(this.getIdColumn(), id));
        if (!exists) {
            throw new Error('Entity not found or access denied');
        }
        return super.update(id, data);
    }

    /**
     * Delete with tenant ownership verification
     */
    override async delete(id: string): Promise<void> {
        const table = this.getTable();
        await this.db.delete(table).where(this.withTenantFilter(eq(this.getIdColumn(), id)));
    }

    // ==================== TENANT-SPECIFIC METHODS ====================

    /**
     * Find all entities for current tenant
     */
    async findAllForTenant(pagination?: PaginationOptions): Promise<TEntity[]> {
        return this.findMany(undefined, pagination);
    }

    /**
     * Count entities for current tenant
     */
    async countForTenant(): Promise<number> {
        return this.count();
    }

    /**
     * Check if entity belongs to current tenant
     */
    async belongsToTenant(id: string): Promise<boolean> {
        return this.exists(eq(this.getIdColumn(), id));
    }

    // ==================== CROSS-TENANT METHODS (ADMIN ONLY) ====================

    /**
     * Find entity by ID ignoring tenant filter.
     * Use with caution - only for admin/system operations.
     */
    async findByIdCrossTenant(id: string): Promise<TEntity | null> {
        const table = this.getTable();
        const results = await this.db.select().from(table).where(eq(this.getIdColumn(), id)).limit(1);
        return (results[0] as TEntity) ?? null;
    }

    /**
     * Find all entities across all tenants.
     * Use with caution - only for admin/system operations.
     */
    async findAllCrossTenant(where?: SQL, pagination?: PaginationOptions): Promise<TEntity[]> {
        const table = this.getTable();
        const { limit = 100 } = pagination ?? {};
        const finalWhere = where ?? sql`1=1`;

        const results = await this.db.select().from(table).where(finalWhere).limit(limit);

        return results as TEntity[];
    }
}
