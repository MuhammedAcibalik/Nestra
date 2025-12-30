/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts access to routes based on user roles
 */

import { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('RoleMiddleware');

/**
 * Extend Request type to include user info from auth middleware
 */
interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role?: string;
        roleName?: string;
        permissions?: string[];
    };
}

/**
 * Creates a middleware that requires the user to have one of the specified roles
 * @param allowedRoles - List of roles that are allowed to access the route
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
            return;
        }

        const userRole = authReq.user.role || authReq.user.roleName || 'user';

        // Super admin always has access
        if (userRole === 'super_admin') {
            next();
            return;
        }

        // Check if user has one of the allowed roles
        if (allowedRoles.includes(userRole)) {
            next();
            return;
        }

        logger.warn('Access denied - insufficient role', {
            userId: authReq.user.id,
            userRole,
            requiredRoles: allowedRoles,
            path: req.path,
            method: req.method
        });

        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions',
                requiredRoles: allowedRoles
            }
        });
    };
}

/**
 * Creates a middleware that requires the user to have one of the specified permissions
 * @param requiredPermissions - List of permissions (at least one must match)
 */
export function requirePermission(...requiredPermissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const authReq = req as AuthenticatedRequest;

        if (!authReq.user) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
            });
            return;
        }

        const userPermissions = authReq.user.permissions || [];
        const userRole = authReq.user.role || authReq.user.roleName || 'user';

        // Super admin always has access
        if (userRole === 'super_admin') {
            next();
            return;
        }

        // Check if user has any of the required permissions
        const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

        if (hasPermission) {
            next();
            return;
        }

        logger.warn('Access denied - missing permission', {
            userId: authReq.user.id,
            userPermissions,
            requiredPermissions,
            path: req.path,
            method: req.method
        });

        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Missing required permission',
                requiredPermissions
            }
        });
    };
}

/**
 * Middleware that requires user to be admin or super_admin
 */
export const requireAdmin = requireRole('admin', 'super_admin');

/**
 * Middleware that requires user to be manager, admin, or super_admin
 */
export const requireManager = requireRole('manager', 'admin', 'super_admin');
