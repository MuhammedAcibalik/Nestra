/**
 * Tenant Context Provider
 * Uses AsyncLocalStorage for request-scoped tenant context
 * Following Singleton Pattern for global access
 */
import { ITenantContext } from './tenant.types';
/**
 * TenantContextProvider
 * Provides request-scoped tenant context using AsyncLocalStorage
 * Enables automatic tenant isolation without passing tenantId through all layers
 */
export declare class TenantContextProvider {
    /**
     * Run a function within a tenant context
     * All code executed within the callback will have access to the tenant context
     */
    static run<T>(context: ITenantContext, fn: () => T): T;
    /**
     * Run an async function within a tenant context
     */
    static runAsync<T>(context: ITenantContext, fn: () => Promise<T>): Promise<T>;
    /**
     * Get current tenant context
     * Returns undefined if no context is set
     */
    static get(): ITenantContext | undefined;
    /**
     * Get current tenant context or throw error
     * Use when tenant context is required
     */
    static getOrThrow(): ITenantContext;
    /**
     * Get current tenant ID
     * Throws TenantContextMissingError if no context is set
     */
    static getTenantId(): string;
    /**
     * Get current tenant ID or null
     * Safe version that returns null instead of throwing
     */
    static getTenantIdOrNull(): string | null;
    /**
     * Get current tenant slug
     */
    static getTenantSlug(): string;
    /**
     * Get current tenant plan
     */
    static getTenantPlan(): string;
    /**
     * Check if we're currently in a tenant context
     */
    static hasContext(): boolean;
    /**
     * Check if current tenant has a specific plan or higher
     */
    static hasPlan(requiredPlan: 'basic' | 'pro' | 'enterprise'): boolean;
    /**
     * Get tenant limits from context
     */
    static getLimits(): import("./tenant.types").ITenantLimits;
}
/**
 * Decorator/wrapper to run a function within tenant context
 */
export declare function withTenantContext<T extends unknown[], R>(context: ITenantContext, fn: (...args: T) => R): (...args: T) => R;
/**
 * Decorator/wrapper to run an async function within tenant context
 */
export declare function withTenantContextAsync<T extends unknown[], R>(context: ITenantContext, fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
/**
 * Get current tenant ID for query filtering
 * Returns the tenant ID if in context, throws otherwise
 */
export declare function getCurrentTenantId(): string;
/**
 * Optional tenant ID getter for queries that can work without tenant context
 */
export declare function getCurrentTenantIdOptional(): string | undefined;
//# sourceMappingURL=tenant.context.d.ts.map