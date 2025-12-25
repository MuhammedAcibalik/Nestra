/**
 * Tenant Types
 * Core interfaces for multi-tenant support
 */
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
export interface ITenantUser {
    readonly userId: string;
    readonly tenantId: string;
    readonly isOwner: boolean;
    readonly isActive: boolean;
    readonly joinedAt: Date;
}
export interface ITenantResolver {
    resolveTenant(identifier: string): Promise<ITenantInfo | null>;
    resolveTenantBySlug(slug: string): Promise<ITenantInfo | null>;
    resolveTenantById(id: string): Promise<ITenantInfo | null>;
}
export declare class TenantNotFoundError extends Error {
    readonly code = "TENANT_NOT_FOUND";
    constructor(identifier: string);
}
export declare class TenantContextMissingError extends Error {
    readonly code = "TENANT_CONTEXT_MISSING";
    constructor();
}
export declare class TenantAccessDeniedError extends Error {
    readonly code = "TENANT_ACCESS_DENIED";
    constructor(tenantId: string);
}
export declare class TenantInactiveError extends Error {
    readonly code = "TENANT_INACTIVE";
    constructor(tenantId: string);
}
//# sourceMappingURL=tenant.types.d.ts.map