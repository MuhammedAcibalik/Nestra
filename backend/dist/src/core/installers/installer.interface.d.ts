/**
 * Module Installer Interface
 * Defines contract for modular dependency injection
 * Following Microservice Pattern: Composition Root Decomposition
 */
import { Database } from '../../db';
import { Router, RequestHandler } from 'express';
import { ServiceRegistry } from '../services';
/**
 * Installation context provided to each module installer
 */
export interface IInstallContext {
    /** Drizzle database instance */
    readonly db: Database;
    /** Service registry for inter-module communication */
    readonly registry: ServiceRegistry;
    /** Auth middleware for protected routes */
    readonly authMiddleware: RequestHandler;
}
/**
 * Result returned from module installation
 */
export interface IModuleResult {
    /** Express router with module routes */
    readonly router: Router;
    /** Base path for the router (e.g., '/api/materials') */
    readonly path: string;
    /** Optional: exposed service instance for cross-module access */
    readonly service?: unknown;
    /** Optional: additional middleware to apply to all routes */
    readonly middleware?: RequestHandler[];
}
/**
 * Module installer contract
 * Each module implements this to self-register its dependencies
 */
export interface IModuleInstaller {
    /** Unique module name */
    readonly name: string;
    /** Installation function */
    install(context: IInstallContext): IModuleResult;
}
/**
 * Registry for collecting all module installers
 */
export declare class InstallerRegistry {
    private readonly installers;
    register(installer: IModuleInstaller): void;
    getAll(): readonly IModuleInstaller[];
    installAll(context: IInstallContext): IModuleResult[];
}
//# sourceMappingURL=installer.interface.d.ts.map