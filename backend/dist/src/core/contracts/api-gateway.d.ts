/**
 * API Gateway
 * Central routing point for all module APIs
 * Provides unified interface, rate limiting, and cross-cutting concerns
 *
 * Following Gateway Pattern for microservice architecture
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IModuleHealth } from './module-contracts';
export interface IGatewayModule {
    name: string;
    version: string;
    router: Router;
    healthCheck(): Promise<IModuleHealth>;
}
export interface IGatewayConfig {
    basePath: string;
    enableRateLimiting: boolean;
    enableMetrics: boolean;
}
/**
 * API Gateway - Central routing and cross-cutting concerns
 */
export declare class ApiGateway {
    private readonly router;
    private readonly modules;
    private readonly config;
    constructor(config?: Partial<IGatewayConfig>);
    /**
     * Register a module with the gateway
     */
    registerModule(module: IGatewayModule): void;
    /**
     * Get the gateway router
     */
    getRouter(): Router;
    /**
     * Setup core gateway routes
     */
    private setupCoreRoutes;
    /**
     * Aggregate health from all modules
     */
    private aggregateHealth;
    /**
     * Middleware for request logging
     */
    static requestLogger(): (req: Request, res: Response, next: NextFunction) => void;
    /**
     * Middleware for rate limiting (simple in-memory implementation)
     */
    static rateLimiter(maxRequests: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => void;
}
/**
 * Create module health check helper
 */
export declare function createHealthCheck(moduleName: string, checkFn?: () => Promise<boolean>): () => Promise<IModuleHealth>;
//# sourceMappingURL=api-gateway.d.ts.map