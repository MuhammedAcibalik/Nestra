/**
 * Tenant Middleware
 * Resolves and sets tenant context for each request
 * Following Single Responsibility Principle (SRP)
 */
import { Request, Response, NextFunction } from 'express';
import { ITenantContext, TenantPlan } from '../core/tenant';
export interface ITenantRequest extends Request {
    tenantContext?: ITenantContext;
}
export interface ITenantTokenPayload {
    tenantId: string;
    tenantSlug: string;
    tenantName?: string;
    tenantPlan?: TenantPlan;
}
/**
 * Tenant Context Middleware
 * Extracts tenant information from authenticated request and sets up context
 * Must be used AFTER auth middleware
 */
export declare function tenantMiddleware(): (req: ITenantRequest, _res: Response, next: NextFunction) => void;
/**
 * Require Tenant Middleware
 * Ensures request has valid tenant context
 * Use for endpoints that require tenant isolation
 */
export declare function requireTenant(): (req: ITenantRequest, res: Response, next: NextFunction) => void;
/**
 * Require Plan Middleware
 * Ensures tenant has minimum required plan
 */
export declare function requirePlan(minimumPlan: TenantPlan): (req: ITenantRequest, res: Response, next: NextFunction) => void;
/**
 * Extract tenant ID from request
 * Utility for use in controllers
 */
export declare function getTenantIdFromRequest(req: ITenantRequest): string | undefined;
/**
 * Extract tenant context from request
 * Utility for use in controllers
 */
export declare function getTenantFromRequest(req: ITenantRequest): ITenantContext | undefined;
//# sourceMappingURL=tenant.middleware.d.ts.map