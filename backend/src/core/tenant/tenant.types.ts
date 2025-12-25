/**
 * Tenant Types
 * Core interfaces for multi-tenant support
 */

// ==================== TENANT CONTEXT ====================

export interface ITenantContext {
    readonly tenantId: string;
    readonly tenantSlug: string;
    readonly tenantName: string;
    readonly plan: TenantPlan;
    readonly limits: ITenantLimits;
}

export type TenantPlan = 'basic' | 'pro' | 'enterprise';

export interface ITenantLimits {
    readonly maxUsers: number;
    readonly maxLocations: number;
    readonly maxMachines: number;
    readonly maxOptimizationsPerDay?: number;
    readonly maxStorageMB?: number;
}

// ==================== TENANT INFO ====================

export interface ITenantInfo {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly plan: TenantPlan;
    readonly isActive: boolean;
    readonly settings?: ITenantSettings;
}

export interface ITenantSettings {
    readonly defaultLanguage?: string;
    readonly timezone?: string;
    readonly dateFormat?: string;
    readonly currency?: string;
    readonly measurementUnit?: 'metric' | 'imperial';
    readonly logoUrl?: string;
    readonly primaryColor?: string;
}

// ==================== TENANT USER ====================

export interface ITenantUser {
    readonly userId: string;
    readonly tenantId: string;
    readonly isOwner: boolean;
    readonly isActive: boolean;
    readonly joinedAt: Date;
}

// ==================== TENANT RESOLUTION ====================

export interface ITenantResolver {
    resolveTenant(identifier: string): Promise<ITenantInfo | null>;
    resolveTenantBySlug(slug: string): Promise<ITenantInfo | null>;
    resolveTenantById(id: string): Promise<ITenantInfo | null>;
}

// ==================== ERRORS ====================

export class TenantNotFoundError extends Error {
    readonly code = 'TENANT_NOT_FOUND';

    constructor(identifier: string) {
        super(`Tenant not found: ${identifier}`);
        this.name = 'TenantNotFoundError';
    }
}

export class TenantContextMissingError extends Error {
    readonly code = 'TENANT_CONTEXT_MISSING';

    constructor() {
        super('Tenant context is required but not available');
        this.name = 'TenantContextMissingError';
    }
}

export class TenantAccessDeniedError extends Error {
    readonly code = 'TENANT_ACCESS_DENIED';

    constructor(tenantId: string) {
        super(`Access denied to tenant: ${tenantId}`);
        this.name = 'TenantAccessDeniedError';
    }
}

export class TenantInactiveError extends Error {
    readonly code = 'TENANT_INACTIVE';

    constructor(tenantId: string) {
        super(`Tenant is inactive: ${tenantId}`);
        this.name = 'TenantInactiveError';
    }
}
