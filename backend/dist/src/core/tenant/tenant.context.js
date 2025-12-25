"use strict";
/**
 * Tenant Context Provider
 * Uses AsyncLocalStorage for request-scoped tenant context
 * Following Singleton Pattern for global access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContextProvider = void 0;
exports.withTenantContext = withTenantContext;
exports.withTenantContextAsync = withTenantContextAsync;
exports.getCurrentTenantId = getCurrentTenantId;
exports.getCurrentTenantIdOptional = getCurrentTenantIdOptional;
const node_async_hooks_1 = require("node:async_hooks");
const tenant_types_1 = require("./tenant.types");
// ==================== ASYNC LOCAL STORAGE ====================
const tenantStorage = new node_async_hooks_1.AsyncLocalStorage();
// ==================== TENANT CONTEXT PROVIDER ====================
/**
 * TenantContextProvider
 * Provides request-scoped tenant context using AsyncLocalStorage
 * Enables automatic tenant isolation without passing tenantId through all layers
 */
class TenantContextProvider {
    /**
     * Run a function within a tenant context
     * All code executed within the callback will have access to the tenant context
     */
    static run(context, fn) {
        return tenantStorage.run(context, fn);
    }
    /**
     * Run an async function within a tenant context
     */
    static async runAsync(context, fn) {
        return tenantStorage.run(context, fn);
    }
    /**
     * Get current tenant context
     * Returns undefined if no context is set
     */
    static get() {
        return tenantStorage.getStore();
    }
    /**
     * Get current tenant context or throw error
     * Use when tenant context is required
     */
    static getOrThrow() {
        const context = tenantStorage.getStore();
        if (!context) {
            throw new tenant_types_1.TenantContextMissingError();
        }
        return context;
    }
    /**
     * Get current tenant ID
     * Throws TenantContextMissingError if no context is set
     */
    static getTenantId() {
        return TenantContextProvider.getOrThrow().tenantId;
    }
    /**
     * Get current tenant ID or null
     * Safe version that returns null instead of throwing
     */
    static getTenantIdOrNull() {
        return tenantStorage.getStore()?.tenantId ?? null;
    }
    /**
     * Get current tenant slug
     */
    static getTenantSlug() {
        return TenantContextProvider.getOrThrow().tenantSlug;
    }
    /**
     * Get current tenant plan
     */
    static getTenantPlan() {
        return TenantContextProvider.getOrThrow().plan;
    }
    /**
     * Check if we're currently in a tenant context
     */
    static hasContext() {
        return tenantStorage.getStore() !== undefined;
    }
    /**
     * Check if current tenant has a specific plan or higher
     */
    static hasPlan(requiredPlan) {
        const context = tenantStorage.getStore();
        if (!context)
            return false;
        const planHierarchy = {
            basic: 1,
            pro: 2,
            enterprise: 3
        };
        const currentLevel = planHierarchy[context.plan] ?? 0;
        const requiredLevel = planHierarchy[requiredPlan] ?? 0;
        return currentLevel >= requiredLevel;
    }
    /**
     * Get tenant limits from context
     */
    static getLimits() {
        return TenantContextProvider.getOrThrow().limits;
    }
}
exports.TenantContextProvider = TenantContextProvider;
// ==================== HELPER FUNCTIONS ====================
/**
 * Decorator/wrapper to run a function within tenant context
 */
function withTenantContext(context, fn) {
    return (...args) => {
        return TenantContextProvider.run(context, () => fn(...args));
    };
}
/**
 * Decorator/wrapper to run an async function within tenant context
 */
function withTenantContextAsync(context, fn) {
    return async (...args) => {
        return TenantContextProvider.runAsync(context, () => fn(...args));
    };
}
/**
 * Get current tenant ID for query filtering
 * Returns the tenant ID if in context, throws otherwise
 */
function getCurrentTenantId() {
    return TenantContextProvider.getTenantId();
}
/**
 * Optional tenant ID getter for queries that can work without tenant context
 */
function getCurrentTenantIdOptional() {
    return TenantContextProvider.getTenantIdOrNull() ?? undefined;
}
//# sourceMappingURL=tenant.context.js.map