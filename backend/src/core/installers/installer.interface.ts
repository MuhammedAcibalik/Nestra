/**
 * Module Installer Interface
 * Defines contract for modular dependency injection
 * Following Microservice Pattern: Composition Root Decomposition
 */

import { Database } from '../../db';
import { Router, RequestHandler } from 'express';
import { ServiceRegistry } from '../services';

// ==================== CONTEXT INTERFACE ====================

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

// ==================== RESULT INTERFACE ====================

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

// ==================== INSTALLER INTERFACE ====================

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

// ==================== INSTALLER REGISTRY ====================

/**
 * Registry for collecting all module installers
 */
export class InstallerRegistry {
    private readonly installers: IModuleInstaller[] = [];

    register(installer: IModuleInstaller): void {
        this.installers.push(installer);
    }

    getAll(): readonly IModuleInstaller[] {
        return this.installers;
    }

    installAll(context: IInstallContext): IModuleResult[] {
        return this.installers.map(installer => {
            console.log(`[INSTALLER] Installing module: ${installer.name}`);
            return installer.install(context);
        });
    }
}
