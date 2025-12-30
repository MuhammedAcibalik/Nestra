/**
 * Versioned Router Factory
 * Creates version-aware Express routers with automatic prefix handling
 * Follows Open/Closed Principle - easy to add new versions
 */

import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiVersion, DEFAULT_API_VERSION, SUPPORTED_VERSIONS } from './version.middleware';
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('VersionedRouter');

// ==================== TYPES ====================

export interface IVersionedRoute {
    /** Route handlers for each version */
    handlers: Partial<Record<ApiVersion, RequestHandler>>;
    /** Fallback if version-specific handler not found */
    fallback?: RequestHandler;
}

export interface IVersionedRouterConfig {
    /** Base path for the router (e.g., 'orders', 'customers') */
    basePath: string;
    /** Whether to include version prefix (default: true) */
    includeVersionPrefix?: boolean;
}

// ==================== VERSIONED ROUTER FACTORY ====================

/**
 * Creates a versioned router that automatically routes to version-specific handlers
 */
export function createVersionedRouter(config: IVersionedRouterConfig): VersionedRouter {
    return new VersionedRouter(config);
}

export class VersionedRouter {
    private readonly v1Router: Router;
    private readonly v2Router: Router;
    private readonly config: Required<IVersionedRouterConfig>;

    constructor(config: IVersionedRouterConfig) {
        this.config = {
            basePath: config.basePath,
            includeVersionPrefix: config.includeVersionPrefix ?? true
        };
        this.v1Router = Router();
        this.v2Router = Router();
    }

    /**
     * Get router for specific version
     */
    getRouter(version: ApiVersion): Router {
        return version === 'v1' ? this.v1Router : this.v2Router;
    }

    /**
     * Get all versioned routers for registration
     */
    getVersionedRouters(): { version: ApiVersion; router: Router; path: string }[] {
        return SUPPORTED_VERSIONS.map(version => ({
            version,
            router: this.getRouter(version),
            path: this.config.includeVersionPrefix
                ? `/api/${version}/${this.config.basePath}`
                : `/api/${this.config.basePath}`
        }));
    }

    /**
     * Register a GET route for specific versions
     */
    get(path: string, ...handlers: RequestHandler[]): this;
    get(path: string, versions: ApiVersion[], ...handlers: RequestHandler[]): this;
    get(path: string, versionsOrHandler: ApiVersion[] | RequestHandler, ...handlers: RequestHandler[]): this {
        return this.registerRoute('get', path, versionsOrHandler, handlers);
    }

    /**
     * Register a POST route for specific versions
     */
    post(path: string, ...handlers: RequestHandler[]): this;
    post(path: string, versions: ApiVersion[], ...handlers: RequestHandler[]): this;
    post(path: string, versionsOrHandler: ApiVersion[] | RequestHandler, ...handlers: RequestHandler[]): this {
        return this.registerRoute('post', path, versionsOrHandler, handlers);
    }

    /**
     * Register a PUT route for specific versions
     */
    put(path: string, ...handlers: RequestHandler[]): this;
    put(path: string, versions: ApiVersion[], ...handlers: RequestHandler[]): this;
    put(path: string, versionsOrHandler: ApiVersion[] | RequestHandler, ...handlers: RequestHandler[]): this {
        return this.registerRoute('put', path, versionsOrHandler, handlers);
    }

    /**
     * Register a PATCH route for specific versions
     */
    patch(path: string, ...handlers: RequestHandler[]): this;
    patch(path: string, versions: ApiVersion[], ...handlers: RequestHandler[]): this;
    patch(path: string, versionsOrHandler: ApiVersion[] | RequestHandler, ...handlers: RequestHandler[]): this {
        return this.registerRoute('patch', path, versionsOrHandler, handlers);
    }

    /**
     * Register a DELETE route for specific versions
     */
    delete(path: string, ...handlers: RequestHandler[]): this;
    delete(path: string, versions: ApiVersion[], ...handlers: RequestHandler[]): this;
    delete(path: string, versionsOrHandler: ApiVersion[] | RequestHandler, ...handlers: RequestHandler[]): this {
        return this.registerRoute('delete', path, versionsOrHandler, handlers);
    }

    /**
     * Register version-specific handler
     */
    forVersion(version: ApiVersion): Router {
        return this.getRouter(version);
    }

    /**
     * Internal route registration
     */
    private registerRoute(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        versionsOrHandler: ApiVersion[] | RequestHandler,
        handlers: RequestHandler[]
    ): this {
        let versions: ApiVersion[];
        let allHandlers: RequestHandler[];

        if (Array.isArray(versionsOrHandler) && typeof versionsOrHandler[0] === 'string') {
            // Versions array provided
            versions = versionsOrHandler as ApiVersion[];
            allHandlers = handlers;
        } else {
            // No versions specified, apply to all
            versions = [...SUPPORTED_VERSIONS];
            allHandlers = [versionsOrHandler as RequestHandler, ...handlers];
        }

        for (const version of versions) {
            const router = this.getRouter(version);
            router[method](path, ...allHandlers);
        }

        return this;
    }
}

// ==================== VERSION-AWARE HANDLER WRAPPER ====================

/**
 * Creates a handler that dispatches to version-specific implementations
 */
export function versionDispatch(handlers: Partial<Record<ApiVersion, RequestHandler>>): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        const version = req.apiVersion ?? DEFAULT_API_VERSION;
        const handler = handlers[version] ?? handlers[DEFAULT_API_VERSION];

        if (!handler) {
            res.status(501).json({
                error: 'VERSION_NOT_SUPPORTED',
                message: `API version ${version} is not supported for this endpoint`
            });
            return;
        }

        handler(req, res, next);
    };
}

// ==================== ROUTE REGISTRATION HELPERS ====================

/**
 * Register versioned routes on Express app
 */
export function mountVersionedRoutes(
    app: { use: (path: string, ...handlers: RequestHandler[]) => void },
    versionedRouter: VersionedRouter,
    ...middleware: RequestHandler[]
): void {
    const routes = versionedRouter.getVersionedRouters();

    for (const route of routes) {
        app.use(route.path, ...middleware, route.router);
        logger.debug('Mounted versioned route', {
            version: route.version,
            path: route.path
        });
    }
}
