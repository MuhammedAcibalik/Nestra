/**
 * Tenant Repository
 * Data access layer for tenant management
 * Following Repository Pattern with Drizzle ORM
 */
import { Database } from '../../db';
import { Tenant, NewTenant, TenantUser, NewTenantUser } from '../../db/schema';
export interface ITenantRepository {
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findAll(options?: ITenantQueryOptions): Promise<Tenant[]>;
    create(data: NewTenant): Promise<Tenant>;
    update(id: string, data: Partial<NewTenant>): Promise<Tenant | null>;
    delete(id: string): Promise<boolean>;
    addUserToTenant(data: NewTenantUser): Promise<TenantUser>;
    removeUserFromTenant(tenantId: string, userId: string): Promise<boolean>;
    getUserTenants(userId: string): Promise<TenantUser[]>;
    getTenantUsers(tenantId: string): Promise<TenantUser[]>;
    isUserInTenant(userId: string, tenantId: string): Promise<boolean>;
    getUserCount(tenantId: string): Promise<number>;
}
export interface ITenantQueryOptions {
    readonly isActive?: boolean;
    readonly plan?: string;
    readonly search?: string;
    readonly limit?: number;
    readonly offset?: number;
}
export declare class TenantRepository implements ITenantRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findAll(options?: ITenantQueryOptions): Promise<Tenant[]>;
    create(data: NewTenant): Promise<Tenant>;
    update(id: string, data: Partial<NewTenant>): Promise<Tenant | null>;
    delete(id: string): Promise<boolean>;
    addUserToTenant(data: NewTenantUser): Promise<TenantUser>;
    removeUserFromTenant(tenantId: string, userId: string): Promise<boolean>;
    getUserTenants(userId: string): Promise<TenantUser[]>;
    getTenantUsers(tenantId: string): Promise<TenantUser[]>;
    isUserInTenant(userId: string, tenantId: string): Promise<boolean>;
    getUserCount(tenantId: string): Promise<number>;
}
//# sourceMappingURL=tenant.repository.d.ts.map