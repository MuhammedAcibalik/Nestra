/**
 * Tenant Middleware
 * Resolves and sets tenant context for each request
 * Following Single Responsibility Principle (SRP)
 */

import { Request, Response, NextFunction } from 'express';
import { TenantContextProvider, ITenantContext, ITenantLimits, TenantPlan } from '../core/tenant';
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('TenantMiddleware');

// ==================== TYPES ====================

export interface ITenantRequest extends Request {
    tenantContext?: ITenantContext;
}

export interface ITenantTokenPayload {
    tenantId: string;
    tenantSlug: string;
    tenantName?: string;
    tenantPlan?: TenantPlan;
}

// ==================== MIDDLEWARE ====================

/**
 * Tenant Context Middleware
 * Extracts tenant information from authenticated request and sets up context
 * Must be used AFTER auth middleware
 */
export function tenantMiddleware() {
    return (req: ITenantRequest, _res: Response, next: NextFunction): void => {
        // Get user from request (set by authMiddleware)
        const user = (req as Request & { user?: ITenantTokenPayload }).user;

        if (!user?.tenantId) {
            // No tenant context needed for this request (public endpoints)
            next();
            return;
        }

        // Build tenant context from token
        const tenantContext: ITenantContext = {
            tenantId: user.tenantId,
            tenantSlug: user.tenantSlug,
            tenantName: user.tenantName ?? 'Unknown',
            plan: user.tenantPlan ?? 'basic',
            limits: getPlanLimits(user.tenantPlan ?? 'basic')
        };

        // Attach to request for direct access
        req.tenantContext = tenantContext;

        // Run the rest of the middleware chain within tenant context
        TenantContextProvider.run(tenantContext, () => {
            logger.debug('Tenant context set', {
                tenantId: tenantContext.tenantId,
                tenantSlug: tenantContext.tenantSlug
            });
            next();
        });
    };
}

/**
 * Require Tenant Middleware
 * Ensures request has valid tenant context
 * Use for endpoints that require tenant isolation
 */
export function requireTenant() {
    return (req: ITenantRequest, res: Response, next: NextFunction): void => {
        if (!req.tenantContext) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TENANT_REQUIRED',
                    message: 'Tenant context is required for this operation'
                }
            });
            return;
        }

        next();
    };
}

/**
 * Require Plan Middleware
 * Ensures tenant has minimum required plan
 */
export function requirePlan(minimumPlan: TenantPlan) {
    return (req: ITenantRequest, res: Response, next: NextFunction): void => {
        if (!req.tenantContext) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'TENANT_REQUIRED',
                    message: 'Tenant context is required'
                }
            });
            return;
        }

        const planHierarchy: Record<TenantPlan, number> = {
            basic: 1,
            pro: 2,
            enterprise: 3
        };

        const currentLevel = planHierarchy[req.tenantContext.plan];
        const requiredLevel = planHierarchy[minimumPlan];

        if (currentLevel < requiredLevel) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'PLAN_UPGRADE_REQUIRED',
                    message: `This feature requires ${minimumPlan} plan or higher`,
                    currentPlan: req.tenantContext.plan,
                    requiredPlan: minimumPlan
                }
            });
            return;
        }

        next();
    };
}

// ==================== HELPERS ====================

/**
 * Get plan limits based on plan type
 */
function getPlanLimits(plan: TenantPlan): ITenantLimits {
    const planLimits: Record<TenantPlan, ITenantLimits> = {
        basic: {
            maxUsers: 5,
            maxLocations: 2,
            maxMachines: 5,
            maxOptimizationsPerDay: 50,
            maxStorageMB: 1024
        },
        pro: {
            maxUsers: 25,
            maxLocations: 10,
            maxMachines: 25,
            maxOptimizationsPerDay: 500,
            maxStorageMB: 10240
        },
        enterprise: {
            maxUsers: 1000,
            maxLocations: 100,
            maxMachines: 500,
            maxOptimizationsPerDay: undefined,  // Unlimited
            maxStorageMB: undefined  // Unlimited
        }
    };

    return planLimits[plan];
}

/**
 * Extract tenant ID from request
 * Utility for use in controllers
 */
export function getTenantIdFromRequest(req: ITenantRequest): string | undefined {
    return req.tenantContext?.tenantId;
}

/**
 * Extract tenant context from request
 * Utility for use in controllers
 */
export function getTenantFromRequest(req: ITenantRequest): ITenantContext | undefined {
    return req.tenantContext;
}
