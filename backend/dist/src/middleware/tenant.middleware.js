"use strict";
/**
 * Tenant Middleware
 * Resolves and sets tenant context for each request
 * Following Single Responsibility Principle (SRP)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
exports.requireTenant = requireTenant;
exports.requirePlan = requirePlan;
exports.getTenantIdFromRequest = getTenantIdFromRequest;
exports.getTenantFromRequest = getTenantFromRequest;
const tenant_1 = require("../core/tenant");
const logger_1 = require("../core/logger");
const logger = (0, logger_1.createModuleLogger)('TenantMiddleware');
// ==================== MIDDLEWARE ====================
/**
 * Tenant Context Middleware
 * Extracts tenant information from authenticated request and sets up context
 * Must be used AFTER auth middleware
 */
function tenantMiddleware() {
    return (req, _res, next) => {
        // Get user from request (set by authMiddleware)
        const user = req.user;
        if (!user?.tenantId) {
            // No tenant context needed for this request (public endpoints)
            next();
            return;
        }
        // Build tenant context from token
        const tenantContext = {
            tenantId: user.tenantId,
            tenantSlug: user.tenantSlug,
            tenantName: user.tenantName ?? 'Unknown',
            plan: user.tenantPlan ?? 'basic',
            limits: getPlanLimits(user.tenantPlan ?? 'basic')
        };
        // Attach to request for direct access
        req.tenantContext = tenantContext;
        // Run the rest of the middleware chain within tenant context
        tenant_1.TenantContextProvider.run(tenantContext, () => {
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
function requireTenant() {
    return (req, res, next) => {
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
function requirePlan(minimumPlan) {
    return (req, res, next) => {
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
        const planHierarchy = {
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
function getPlanLimits(plan) {
    const planLimits = {
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
            maxOptimizationsPerDay: undefined, // Unlimited
            maxStorageMB: undefined // Unlimited
        }
    };
    return planLimits[plan];
}
/**
 * Extract tenant ID from request
 * Utility for use in controllers
 */
function getTenantIdFromRequest(req) {
    return req.tenantContext?.tenantId;
}
/**
 * Extract tenant context from request
 * Utility for use in controllers
 */
function getTenantFromRequest(req) {
    return req.tenantContext;
}
//# sourceMappingURL=tenant.middleware.js.map