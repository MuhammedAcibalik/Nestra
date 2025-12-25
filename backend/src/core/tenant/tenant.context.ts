/**
 * Tenant Context Provider
 * Uses AsyncLocalStorage for request-scoped tenant context
 * Following Singleton Pattern for global access
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import { ITenantContext, TenantContextMissingError } from './tenant.types';

// ==================== ASYNC LOCAL STORAGE ====================

const tenantStorage = new AsyncLocalStorage<ITenantContext>();

// ==================== TENANT CONTEXT PROVIDER ====================

/**
 * TenantContextProvider
 * Provides request-scoped tenant context using AsyncLocalStorage
 * Enables automatic tenant isolation without passing tenantId through all layers
 */
export class TenantContextProvider {
    /**
     * Run a function within a tenant context
     * All code executed within the callback will have access to the tenant context
     */
    static run<T>(context: ITenantContext, fn: () => T): T {
        return tenantStorage.run(context, fn);
    }

    /**
     * Run an async function within a tenant context
     */
    static async runAsync<T>(context: ITenantContext, fn: () => Promise<T>): Promise<T> {
        return tenantStorage.run(context, fn);
    }

    /**
     * Get current tenant context
     * Returns undefined if no context is set
     */
    static get(): ITenantContext | undefined {
        return tenantStorage.getStore();
    }

    /**
     * Get current tenant context or throw error
     * Use when tenant context is required
     */
    static getOrThrow(): ITenantContext {
        const context = tenantStorage.getStore();
        if (!context) {
            throw new TenantContextMissingError();
        }
        return context;
    }

    /**
     * Get current tenant ID
     * Throws TenantContextMissingError if no context is set
     */
    static getTenantId(): string {
        return TenantContextProvider.getOrThrow().tenantId;
    }

    /**
     * Get current tenant ID or null
     * Safe version that returns null instead of throwing
     */
    static getTenantIdOrNull(): string | null {
        return tenantStorage.getStore()?.tenantId ?? null;
    }

    /**
     * Get current tenant slug
     */
    static getTenantSlug(): string {
        return TenantContextProvider.getOrThrow().tenantSlug;
    }

    /**
     * Get current tenant plan
     */
    static getTenantPlan(): string {
        return TenantContextProvider.getOrThrow().plan;
    }

    /**
     * Check if we're currently in a tenant context
     */
    static hasContext(): boolean {
        return tenantStorage.getStore() !== undefined;
    }

    /**
     * Check if current tenant has a specific plan or higher
     */
    static hasPlan(requiredPlan: 'basic' | 'pro' | 'enterprise'): boolean {
        const context = tenantStorage.getStore();
        if (!context) return false;

        const planHierarchy: Record<string, number> = {
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

// ==================== HELPER FUNCTIONS ====================

/**
 * Decorator/wrapper to run a function within tenant context
 */
export function withTenantContext<T extends unknown[], R>(
    context: ITenantContext,
    fn: (...args: T) => R
): (...args: T) => R {
    return (...args: T): R => {
        return TenantContextProvider.run(context, () => fn(...args));
    };
}

/**
 * Decorator/wrapper to run an async function within tenant context
 */
export function withTenantContextAsync<T extends unknown[], R>(
    context: ITenantContext,
    fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
        return TenantContextProvider.runAsync(context, () => fn(...args));
    };
}

/**
 * Get current tenant ID for query filtering
 * Returns the tenant ID if in context, throws otherwise
 */
export function getCurrentTenantId(): string {
    return TenantContextProvider.getTenantId();
}

/**
 * Optional tenant ID getter for queries that can work without tenant context
 */
export function getCurrentTenantIdOptional(): string | undefined {
    return TenantContextProvider.getTenantIdOrNull() ?? undefined;
}
