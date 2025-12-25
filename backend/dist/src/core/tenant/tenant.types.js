"use strict";
/**
 * Tenant Types
 * Core interfaces for multi-tenant support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantInactiveError = exports.TenantAccessDeniedError = exports.TenantContextMissingError = exports.TenantNotFoundError = void 0;
// ==================== ERRORS ====================
class TenantNotFoundError extends Error {
    code = 'TENANT_NOT_FOUND';
    constructor(identifier) {
        super(`Tenant not found: ${identifier}`);
        this.name = 'TenantNotFoundError';
    }
}
exports.TenantNotFoundError = TenantNotFoundError;
class TenantContextMissingError extends Error {
    code = 'TENANT_CONTEXT_MISSING';
    constructor() {
        super('Tenant context is required but not available');
        this.name = 'TenantContextMissingError';
    }
}
exports.TenantContextMissingError = TenantContextMissingError;
class TenantAccessDeniedError extends Error {
    code = 'TENANT_ACCESS_DENIED';
    constructor(tenantId) {
        super(`Access denied to tenant: ${tenantId}`);
        this.name = 'TenantAccessDeniedError';
    }
}
exports.TenantAccessDeniedError = TenantAccessDeniedError;
class TenantInactiveError extends Error {
    code = 'TENANT_INACTIVE';
    constructor(tenantId) {
        super(`Tenant is inactive: ${tenantId}`);
        this.name = 'TenantInactiveError';
    }
}
exports.TenantInactiveError = TenantInactiveError;
//# sourceMappingURL=tenant.types.js.map