/**
 * Permission Middleware
 * Route protection based on RBAC permissions
 */

import { Request, Response, NextFunction } from 'express';
import { RbacService } from './rbac.service';
import { ITenantRequest } from '../../core/interfaces';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('PermissionMiddleware');

// ==================== TYPES ====================

interface IAuthRequest extends Request {
    user?: {
        id: string;
        roleId: string;
        email?: string;
    };
    tenantId?: string;
}

// ==================== MIDDLEWARE FACTORY ====================

/**
 * Create a permission checking middleware
 * @param rbacService - RBAC service instance
 */
export function createPermissionMiddleware(rbacService: RbacService) {
    /**
     * Require a specific permission
     * @param permissionCode - Permission code to check (e.g., 'orders:create')
     */
    function requirePermission(permissionCode: string) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const authReq = req as IAuthRequest;
                const roleId = authReq.user?.roleId;

                if (!roleId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }

                const hasPermission = await rbacService.hasPermission(roleId, permissionCode);

                if (!hasPermission) {
                    logger.warn('Permission denied', {
                        userId: authReq.user?.id,
                        roleId,
                        requiredPermission: permissionCode
                    });
                    res.status(403).json({
                        success: false,
                        error: 'Permission denied',
                        requiredPermission: permissionCode
                    });
                    return;
                }

                next();
            } catch (error) {
                logger.error('Permission check error', { error });
                res.status(500).json({
                    success: false,
                    error: 'Permission check failed'
                });
            }
        };
    }

    /**
     * Require any of the specified permissions
     * @param permissionCodes - Array of permission codes (OR logic)
     */
    function requireAnyPermission(...permissionCodes: string[]) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const authReq = req as IAuthRequest;
                const roleId = authReq.user?.roleId;

                if (!roleId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }

                const hasAny = await rbacService.hasAnyPermission(roleId, permissionCodes);

                if (!hasAny) {
                    logger.warn('Permission denied - none of required permissions', {
                        userId: authReq.user?.id,
                        roleId,
                        requiredPermissions: permissionCodes
                    });
                    res.status(403).json({
                        success: false,
                        error: 'Permission denied',
                        requiredPermissions: permissionCodes
                    });
                    return;
                }

                next();
            } catch (error) {
                logger.error('Permission check error', { error });
                res.status(500).json({
                    success: false,
                    error: 'Permission check failed'
                });
            }
        };
    }

    /**
     * Require all of the specified permissions
     * @param permissionCodes - Array of permission codes (AND logic)
     */
    function requireAllPermissions(...permissionCodes: string[]) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                const authReq = req as IAuthRequest;
                const roleId = authReq.user?.roleId;

                if (!roleId) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication required'
                    });
                    return;
                }

                const hasAll = await rbacService.hasAllPermissions(roleId, permissionCodes);

                if (!hasAll) {
                    logger.warn('Permission denied - missing some required permissions', {
                        userId: authReq.user?.id,
                        roleId,
                        requiredPermissions: permissionCodes
                    });
                    res.status(403).json({
                        success: false,
                        error: 'Permission denied',
                        requiredPermissions: permissionCodes
                    });
                    return;
                }

                next();
            } catch (error) {
                logger.error('Permission check error', { error });
                res.status(500).json({
                    success: false,
                    error: 'Permission check failed'
                });
            }
        };
    }

    /**
     * Require admin permission
     */
    function requireAdmin() {
        return requirePermission('admin:manage');
    }

    return {
        requirePermission,
        requireAnyPermission,
        requireAllPermissions,
        requireAdmin
    };
}

// ==================== PERMISSION CONSTANTS ====================

export const PERMISSIONS = {
    // Orders
    ORDERS_CREATE: 'orders:create',
    ORDERS_READ: 'orders:read',
    ORDERS_UPDATE: 'orders:update',
    ORDERS_DELETE: 'orders:delete',
    ORDERS_APPROVE: 'orders:approve',

    // Stock
    STOCK_CREATE: 'stock:create',
    STOCK_READ: 'stock:read',
    STOCK_UPDATE: 'stock:update',
    STOCK_DELETE: 'stock:delete',

    // Production
    PRODUCTION_CREATE: 'production:create',
    PRODUCTION_READ: 'production:read',
    PRODUCTION_UPDATE: 'production:update',

    // Optimization
    OPTIMIZATION_CREATE: 'optimization:create',
    OPTIMIZATION_READ: 'optimization:read',
    OPTIMIZATION_APPROVE: 'optimization:approve',

    // Reports
    REPORTS_READ: 'reports:read',
    REPORTS_EXPORT: 'reports:export',

    // Users
    USERS_CREATE: 'users:create',
    USERS_READ: 'users:read',
    USERS_UPDATE: 'users:update',
    USERS_DELETE: 'users:delete',
    USERS_MANAGE: 'users:manage',

    // Suppliers
    SUPPLIERS_CREATE: 'suppliers:create',
    SUPPLIERS_READ: 'suppliers:read',
    SUPPLIERS_UPDATE: 'suppliers:update',
    SUPPLIERS_DELETE: 'suppliers:delete',

    // Admin
    ADMIN_MANAGE: 'admin:manage'
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS];
