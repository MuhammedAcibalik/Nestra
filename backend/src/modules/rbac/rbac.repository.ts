/**
 * RBAC Repository
 * Data access layer for permissions, roles, and role-permission mappings
 */

import { eq, and, inArray } from 'drizzle-orm';
import { Database } from '../../db';
import {
    permissions,
    rolePermissions,
    tenantRoles,
    tenantRolePermissions,
    Permission,
    NewPermission,
    RolePermission,
    NewRolePermission,
    TenantRole,
    NewTenantRole,
    TenantRolePermission,
    NewTenantRolePermission,
    PermissionCategory,
    PermissionAction
} from '../../db/schema';
import { roles } from '../../db/schema/auth';

// ==================== INTERFACES ====================

export interface IPermissionFilter {
    category?: PermissionCategory;
    action?: PermissionAction;
}

export interface ITenantRoleFilter {
    tenantId: string;
    includePermissions?: boolean;
}

// ==================== REPOSITORY ====================

export class RbacRepository {
    constructor(private readonly db: Database) { }

    // ==================== PERMISSIONS ====================

    async findAllPermissions(filter: IPermissionFilter = {}): Promise<Permission[]> {
        const conditions = [];

        if (filter.category) {
            conditions.push(eq(permissions.category, filter.category));
        }
        if (filter.action) {
            conditions.push(eq(permissions.action, filter.action));
        }

        const query = this.db.select().from(permissions);
        return conditions.length > 0 ? query.where(and(...conditions)) : query;
    }

    async findPermissionById(id: string): Promise<Permission | null> {
        const [permission] = await this.db
            .select()
            .from(permissions)
            .where(eq(permissions.id, id))
            .limit(1);
        return permission ?? null;
    }

    async findPermissionByCode(code: string): Promise<Permission | null> {
        const [permission] = await this.db
            .select()
            .from(permissions)
            .where(eq(permissions.code, code))
            .limit(1);
        return permission ?? null;
    }

    async findPermissionsByCodes(codes: string[]): Promise<Permission[]> {
        if (codes.length === 0) return [];
        return this.db
            .select()
            .from(permissions)
            .where(inArray(permissions.code, codes));
    }

    async createPermission(data: NewPermission): Promise<Permission> {
        const [permission] = await this.db
            .insert(permissions)
            .values(data)
            .returning();
        return permission;
    }

    // ==================== ROLE PERMISSIONS ====================

    async findRolePermissions(roleId: string): Promise<Permission[]> {
        const result = await this.db
            .select({
                permission: permissions
            })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, roleId));

        return result.map(r => r.permission);
    }

    async findRolePermissionCodes(roleId: string): Promise<string[]> {
        const perms = await this.findRolePermissions(roleId);
        return perms.map(p => p.code);
    }

    async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
        const [rp] = await this.db
            .insert(rolePermissions)
            .values({ roleId, permissionId })
            .onConflictDoNothing()
            .returning();
        return rp;
    }

    async removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
        const result = await this.db
            .delete(rolePermissions)
            .where(and(
                eq(rolePermissions.roleId, roleId),
                eq(rolePermissions.permissionId, permissionId)
            ));
        return true;
    }

    async syncRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
        // Remove all current permissions
        await this.db
            .delete(rolePermissions)
            .where(eq(rolePermissions.roleId, roleId));

        // Add new permissions
        if (permissionIds.length > 0) {
            await this.db
                .insert(rolePermissions)
                .values(permissionIds.map(permissionId => ({ roleId, permissionId })));
        }
    }

    // ==================== TENANT ROLES ====================

    async findTenantRoles(tenantId: string): Promise<TenantRole[]> {
        return this.db
            .select()
            .from(tenantRoles)
            .where(eq(tenantRoles.tenantId, tenantId));
    }

    async findTenantRoleById(id: string): Promise<TenantRole | null> {
        const [role] = await this.db
            .select()
            .from(tenantRoles)
            .where(eq(tenantRoles.id, id))
            .limit(1);
        return role ?? null;
    }

    async createTenantRole(data: NewTenantRole): Promise<TenantRole> {
        const [role] = await this.db
            .insert(tenantRoles)
            .values(data)
            .returning();
        return role;
    }

    async updateTenantRole(id: string, data: Partial<NewTenantRole>): Promise<TenantRole | null> {
        const [updated] = await this.db
            .update(tenantRoles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(tenantRoles.id, id))
            .returning();
        return updated ?? null;
    }

    async deleteTenantRole(id: string): Promise<boolean> {
        await this.db
            .delete(tenantRoles)
            .where(eq(tenantRoles.id, id));
        return true;
    }

    // ==================== TENANT ROLE PERMISSIONS ====================

    async findTenantRolePermissions(tenantRoleId: string): Promise<Permission[]> {
        const result = await this.db
            .select({
                permission: permissions
            })
            .from(tenantRolePermissions)
            .innerJoin(permissions, eq(tenantRolePermissions.permissionId, permissions.id))
            .where(eq(tenantRolePermissions.tenantRoleId, tenantRoleId));

        return result.map(r => r.permission);
    }

    async findTenantRolePermissionCodes(tenantRoleId: string): Promise<string[]> {
        const perms = await this.findTenantRolePermissions(tenantRoleId);
        return perms.map(p => p.code);
    }

    async syncTenantRolePermissions(tenantRoleId: string, permissionIds: string[]): Promise<void> {
        // Remove all current permissions
        await this.db
            .delete(tenantRolePermissions)
            .where(eq(tenantRolePermissions.tenantRoleId, tenantRoleId));

        // Add new permissions
        if (permissionIds.length > 0) {
            await this.db
                .insert(tenantRolePermissions)
                .values(permissionIds.map(permissionId => ({ tenantRoleId, permissionId })));
        }
    }

    // ==================== PERMISSION CHECK ====================

    async hasRolePermission(roleId: string, permissionCode: string): Promise<boolean> {
        const result = await this.db
            .select({ id: rolePermissions.id })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(and(
                eq(rolePermissions.roleId, roleId),
                eq(permissions.code, permissionCode)
            ))
            .limit(1);

        return result.length > 0;
    }

    async hasAnyRolePermission(roleId: string, permissionCodes: string[]): Promise<boolean> {
        if (permissionCodes.length === 0) return false;

        const result = await this.db
            .select({ id: rolePermissions.id })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(and(
                eq(rolePermissions.roleId, roleId),
                inArray(permissions.code, permissionCodes)
            ))
            .limit(1);

        return result.length > 0;
    }
}
