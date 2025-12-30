/**
 * RBAC Module
 * Role-Based Access Control barrel export
 */

// Repository
export { RbacRepository, IPermissionFilter, ITenantRoleFilter } from './rbac.repository';

// Service
export { RbacService } from './rbac.service';

// Middleware
export {
    createPermissionMiddleware,
    PERMISSIONS,
    PermissionCode
} from './permission.middleware';
