/**
 * RBAC Service
 * Business logic for permission checking and role management
 */

import { RbacRepository, IPermissionFilter, ITenantRoleFilter } from './rbac.repository';
import {
    Permission,
    NewPermission,
    TenantRole,
    NewTenantRole,
    PermissionCategory,
    PermissionAction
} from '../../db/schema';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('RbacService');

// ==================== SERVICE RESULT ====================

type IServiceResult<T> = { success: true; data: T } | { success: false; error: string };

// ==================== CACHE ====================

interface IPermissionCache {
    permissions: string[];
    cachedAt: number;
}

// Permission cache with TTL (5 minutes)
const permissionCache = new Map<string, IPermissionCache>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// ==================== SERVICE ====================

export class RbacService {
    constructor(private readonly repository: RbacRepository) { }

    // ==================== PERMISSIONS ====================

    async getAllPermissions(filter?: IPermissionFilter): Promise<IServiceResult<Permission[]>> {
        try {
            const permissions = await this.repository.findAllPermissions(filter);
            return { success: true, data: permissions };
        } catch (error) {
            logger.error('Failed to get permissions', { error });
            return { success: false, error: 'Failed to retrieve permissions' };
        }
    }

    async getPermissionsByCategory(category: PermissionCategory): Promise<IServiceResult<Permission[]>> {
        return this.getAllPermissions({ category });
    }

    async createPermission(
        code: string,
        name: string,
        category: PermissionCategory,
        action: PermissionAction,
        description?: string
    ): Promise<IServiceResult<Permission>> {
        try {
            // Check for duplicate
            const existing = await this.repository.findPermissionByCode(code);
            if (existing) {
                return { success: false, error: `Permission ${code} already exists` };
            }

            const permission = await this.repository.createPermission({
                code,
                name,
                category,
                action,
                description
            });

            logger.info('Permission created', { permissionId: permission.id, code });
            return { success: true, data: permission };
        } catch (error) {
            logger.error('Failed to create permission', { code, error });
            return { success: false, error: 'Failed to create permission' };
        }
    }

    // ==================== ROLE PERMISSIONS ====================

    async getRolePermissions(roleId: string): Promise<IServiceResult<Permission[]>> {
        try {
            const permissions = await this.repository.findRolePermissions(roleId);
            return { success: true, data: permissions };
        } catch (error) {
            logger.error('Failed to get role permissions', { roleId, error });
            return { success: false, error: 'Failed to retrieve role permissions' };
        }
    }

    async setRolePermissions(roleId: string, permissionCodes: string[]): Promise<IServiceResult<void>> {
        try {
            // Get permission IDs from codes
            const permissions = await this.repository.findPermissionsByCodes(permissionCodes);
            const permissionIds = permissions.map(p => p.id);

            await this.repository.syncRolePermissions(roleId, permissionIds);

            // Invalidate cache
            this.invalidateCacheForRole(roleId);

            logger.info('Role permissions updated', { roleId, count: permissionIds.length });
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to set role permissions', { roleId, error });
            return { success: false, error: 'Failed to update role permissions' };
        }
    }

    // ==================== TENANT ROLES ====================

    async getTenantRoles(tenantId: string): Promise<IServiceResult<TenantRole[]>> {
        try {
            const roles = await this.repository.findTenantRoles(tenantId);
            return { success: true, data: roles };
        } catch (error) {
            logger.error('Failed to get tenant roles', { tenantId, error });
            return { success: false, error: 'Failed to retrieve tenant roles' };
        }
    }

    async createTenantRole(
        tenantId: string,
        name: string,
        displayName: string,
        description?: string
    ): Promise<IServiceResult<TenantRole>> {
        try {
            const role = await this.repository.createTenantRole({
                tenantId,
                name,
                displayName,
                description
            });

            logger.info('Tenant role created', { roleId: role.id, tenantId, name });
            return { success: true, data: role };
        } catch (error) {
            logger.error('Failed to create tenant role', { tenantId, name, error });
            return { success: false, error: 'Failed to create tenant role' };
        }
    }

    async setTenantRolePermissions(
        tenantRoleId: string,
        permissionCodes: string[]
    ): Promise<IServiceResult<void>> {
        try {
            const permissions = await this.repository.findPermissionsByCodes(permissionCodes);
            const permissionIds = permissions.map(p => p.id);

            await this.repository.syncTenantRolePermissions(tenantRoleId, permissionIds);

            // Invalidate cache
            this.invalidateCacheForTenantRole(tenantRoleId);

            logger.info('Tenant role permissions updated', { tenantRoleId, count: permissionIds.length });
            return { success: true, data: undefined };
        } catch (error) {
            logger.error('Failed to set tenant role permissions', { tenantRoleId, error });
            return { success: false, error: 'Failed to update tenant role permissions' };
        }
    }

    // ==================== PERMISSION CHECKING ====================

    /**
     * Check if a role has a specific permission
     * Uses in-memory cache for performance
     */
    async hasPermission(roleId: string, permissionCode: string): Promise<boolean> {
        try {
            const userPermissions = await this.getCachedRolePermissions(roleId);
            return userPermissions.includes(permissionCode);
        } catch (error) {
            logger.error('Permission check failed', { roleId, permissionCode, error });
            return false;
        }
    }

    /**
     * Check if a role has any of the specified permissions
     */
    async hasAnyPermission(roleId: string, permissionCodes: string[]): Promise<boolean> {
        try {
            const userPermissions = await this.getCachedRolePermissions(roleId);
            return permissionCodes.some(code => userPermissions.includes(code));
        } catch (error) {
            logger.error('Permission check failed', { roleId, permissionCodes, error });
            return false;
        }
    }

    /**
     * Check if a role has all of the specified permissions
     */
    async hasAllPermissions(roleId: string, permissionCodes: string[]): Promise<boolean> {
        try {
            const userPermissions = await this.getCachedRolePermissions(roleId);
            return permissionCodes.every(code => userPermissions.includes(code));
        } catch (error) {
            logger.error('Permission check failed', { roleId, permissionCodes, error });
            return false;
        }
    }

    // ==================== CACHE MANAGEMENT ====================

    private async getCachedRolePermissions(roleId: string): Promise<string[]> {
        const cacheKey = `role:${roleId}`;
        const cached = permissionCache.get(cacheKey);

        if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
            return cached.permissions;
        }

        // Fetch from database
        const permissions = await this.repository.findRolePermissionCodes(roleId);

        // Update cache
        permissionCache.set(cacheKey, {
            permissions,
            cachedAt: Date.now()
        });

        return permissions;
    }

    private invalidateCacheForRole(roleId: string): void {
        permissionCache.delete(`role:${roleId}`);
    }

    private invalidateCacheForTenantRole(tenantRoleId: string): void {
        permissionCache.delete(`tenant_role:${tenantRoleId}`);
    }

    /**
     * Clear all permission cache
     */
    clearCache(): void {
        permissionCache.clear();
        logger.info('Permission cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; ttlMs: number } {
        return {
            size: permissionCache.size,
            ttlMs: CACHE_TTL_MS
        };
    }
}
