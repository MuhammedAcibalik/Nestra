/**
 * API Gateway
 * Central routing point for all module APIs
 * Provides unified interface, rate limiting, and cross-cutting concerns
 *
 * Following Gateway Pattern for microservice architecture
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IModuleHealth, IModuleInfo } from './module-contracts';

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
export class ApiGateway {
    private readonly router: Router;
    private readonly modules: Map<string, IGatewayModule> = new Map();
    private readonly config: IGatewayConfig;

    constructor(config: Partial<IGatewayConfig> = {}) {
        this.router = Router();
        this.config = {
            basePath: '/api',
            enableRateLimiting: false,
            enableMetrics: true,
            ...config
        };

        this.setupCoreRoutes();
    }

    /**
     * Register a module with the gateway
     */
    registerModule(module: IGatewayModule): void {
        this.modules.set(module.name, module);
        console.log(`[GATEWAY] Registered module: ${module.name} v${module.version}`);
    }

    /**
     * Get the gateway router
     */
    getRouter(): Router {
        return this.router;
    }

    /**
     * Setup core gateway routes
     */
    private setupCoreRoutes(): void {
        // Health check endpoint
        this.router.get('/health', async (_req: Request, res: Response) => {
            const health = await this.aggregateHealth();

            let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
            if (health.some((h) => h.status === 'unhealthy')) {
                overallStatus = 'unhealthy';
            } else if (health.some((h) => h.status === 'degraded')) {
                overallStatus = 'degraded';
            }

            res.json({
                status: overallStatus,
                timestamp: new Date().toISOString(),
                modules: health
            });
        });

        // Module info endpoint
        this.router.get('/modules', (_req: Request, res: Response) => {
            const modules: IModuleInfo[] = Array.from(this.modules.values()).map((m) => ({
                name: m.name,
                version: m.version,
                dependencies: []
            }));

            res.json({
                count: modules.length,
                modules
            });
        });

        // Metrics endpoint (if enabled)
        if (this.config.enableMetrics) {
            this.router.get('/metrics', (_req: Request, res: Response) => {
                res.json({
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    modules: this.modules.size
                });
            });
        }
    }

    /**
     * Aggregate health from all modules
     */
    private async aggregateHealth(): Promise<IModuleHealth[]> {
        const healthPromises = Array.from(this.modules.values()).map(async (module) => {
            try {
                return await module.healthCheck();
            } catch (error) {
                return {
                    module: module.name,
                    status: 'unhealthy' as const,
                    timestamp: new Date(),
                    details: { error: error instanceof Error ? error.message : 'Unknown error' }
                };
            }
        });

        return Promise.all(healthPromises);
    }

    /**
     * Middleware for request logging
     */
    static requestLogger(): (req: Request, res: Response, next: NextFunction) => void {
        return (req: Request, _res: Response, next: NextFunction) => {
            console.log(`[GATEWAY] ${req.method} ${req.path}`);
            next();
        };
    }

    /**
     * Middleware for rate limiting (simple in-memory implementation)
     */
    static rateLimiter(
        maxRequests: number,
        windowMs: number
    ): (req: Request, res: Response, next: NextFunction) => void {
        const requests = new Map<string, { count: number; resetTime: number }>();

        return (req: Request, res: Response, next: NextFunction) => {
            const ip = req.ip ?? 'unknown';
            const now = Date.now();
            const record = requests.get(ip);

            if (!record || now > record.resetTime) {
                requests.set(ip, { count: 1, resetTime: now + windowMs });
                next();
            } else if (record.count < maxRequests) {
                record.count++;
                next();
            } else {
                res.status(429).json({ error: 'Too many requests' });
            }
        };
    }
}

/**
 * Create module health check helper
 */
export function createHealthCheck(moduleName: string, checkFn?: () => Promise<boolean>): () => Promise<IModuleHealth> {
    return async () => {
        try {
            const isHealthy = checkFn ? await checkFn() : true;
            return {
                module: moduleName,
                status: isHealthy ? 'healthy' : 'degraded',
                timestamp: new Date()
            };
        } catch (error) {
            console.debug(`[HEALTH] Module ${moduleName} health check failed:`, error);
            return {
                module: moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    };
}
