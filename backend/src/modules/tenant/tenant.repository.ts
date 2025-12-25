/**
 * Tenant Repository
 * Data access layer for tenant management
 * Following Repository Pattern with Drizzle ORM
 */

import { eq, and, like } from 'drizzle-orm';
import { Database } from '../../db';
import { tenants, tenantUsers, Tenant, NewTenant, TenantUser, NewTenantUser } from '../../db/schema';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('TenantRepository');

// ==================== INTERFACES ====================

export interface ITenantRepository {
    // Tenant CRUD
    findById(id: string): Promise<Tenant | null>;
    findBySlug(slug: string): Promise<Tenant | null>;
    findAll(options?: ITenantQueryOptions): Promise<Tenant[]>;
    create(data: NewTenant): Promise<Tenant>;
    update(id: string, data: Partial<NewTenant>): Promise<Tenant | null>;
    delete(id: string): Promise<boolean>;

    // Tenant Users
    addUserToTenant(data: NewTenantUser): Promise<TenantUser>;
    removeUserFromTenant(tenantId: string, userId: string): Promise<boolean>;
    getUserTenants(userId: string): Promise<TenantUser[]>;
    getTenantUsers(tenantId: string): Promise<TenantUser[]>;
    isUserInTenant(userId: string, tenantId: string): Promise<boolean>;

    // Stats
    getUserCount(tenantId: string): Promise<number>;
}

export interface ITenantQueryOptions {
    readonly isActive?: boolean;
    readonly plan?: string;
    readonly search?: string;
    readonly limit?: number;
    readonly offset?: number;
}

// ==================== REPOSITORY ====================

export class TenantRepository implements ITenantRepository {
    constructor(private readonly db: Database) { }

    // ==================== TENANT CRUD ====================

    async findById(id: string): Promise<Tenant | null> {
        const result = await this.db.query.tenants.findFirst({
            where: eq(tenants.id, id)
        });
        return result ?? null;
    }

    async findBySlug(slug: string): Promise<Tenant | null> {
        const result = await this.db.query.tenants.findFirst({
            where: eq(tenants.slug, slug)
        });
        return result ?? null;
    }

    async findAll(options: ITenantQueryOptions = {}): Promise<Tenant[]> {
        const conditions = [];

        if (options.isActive !== undefined) {
            conditions.push(eq(tenants.isActive, options.isActive));
        }

        if (options.plan) {
            conditions.push(eq(tenants.plan, options.plan));
        }

        if (options.search) {
            conditions.push(like(tenants.name, `%${options.search}%`));
        }

        const query = this.db
            .select()
            .from(tenants)
            .limit(options.limit ?? 100)
            .offset(options.offset ?? 0);

        if (conditions.length > 0) {
            return query.where(and(...conditions));
        }

        return query;
    }

    async create(data: NewTenant): Promise<Tenant> {
        const [result] = await this.db
            .insert(tenants)
            .values(data)
            .returning();

        logger.info('Tenant created', { id: result.id, slug: result.slug });
        return result;
    }

    async update(id: string, data: Partial<NewTenant>): Promise<Tenant | null> {
        const [result] = await this.db
            .update(tenants)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tenants.id, id))
            .returning();

        if (result) {
            logger.info('Tenant updated', { id: result.id });
        }
        return result ?? null;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.db
            .delete(tenants)
            .where(eq(tenants.id, id))
            .returning({ id: tenants.id });

        if (result.length > 0) {
            logger.info('Tenant deleted', { id });
            return true;
        }
        return false;
    }

    // ==================== TENANT USERS ====================

    async addUserToTenant(data: NewTenantUser): Promise<TenantUser> {
        const [result] = await this.db
            .insert(tenantUsers)
            .values(data)
            .returning();

        logger.info('User added to tenant', {
            userId: result.userId,
            tenantId: result.tenantId
        });
        return result;
    }

    async removeUserFromTenant(tenantId: string, userId: string): Promise<boolean> {
        const result = await this.db
            .delete(tenantUsers)
            .where(
                and(
                    eq(tenantUsers.tenantId, tenantId),
                    eq(tenantUsers.userId, userId)
                )
            )
            .returning({ id: tenantUsers.id });

        if (result.length > 0) {
            logger.info('User removed from tenant', { userId, tenantId });
            return true;
        }
        return false;
    }

    async getUserTenants(userId: string): Promise<TenantUser[]> {
        return this.db.query.tenantUsers.findMany({
            where: eq(tenantUsers.userId, userId),
            with: {
                tenant: true
            }
        });
    }

    async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
        return this.db.query.tenantUsers.findMany({
            where: eq(tenantUsers.tenantId, tenantId)
        });
    }

    async isUserInTenant(userId: string, tenantId: string): Promise<boolean> {
        const result = await this.db.query.tenantUsers.findFirst({
            where: and(
                eq(tenantUsers.userId, userId),
                eq(tenantUsers.tenantId, tenantId),
                eq(tenantUsers.isActive, true)
            )
        });
        return result !== undefined;
    }

    // ==================== STATS ====================

    async getUserCount(tenantId: string): Promise<number> {
        const users = await this.db.query.tenantUsers.findMany({
            where: and(
                eq(tenantUsers.tenantId, tenantId),
                eq(tenantUsers.isActive, true)
            )
        });
        return users.length;
    }
}
