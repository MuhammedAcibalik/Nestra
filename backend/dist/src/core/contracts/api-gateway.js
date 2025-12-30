"use strict";
/**
 * API Gateway
 * Central routing point for all module APIs
 * Provides unified interface, rate limiting, and cross-cutting concerns
 *
 * Following Gateway Pattern for microservice architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiGateway = void 0;
exports.createHealthCheck = createHealthCheck;
const express_1 = require("express");
/**
 * API Gateway - Central routing and cross-cutting concerns
 */
class ApiGateway {
    router;
    modules = new Map();
    config;
    constructor(config = {}) {
        this.router = (0, express_1.Router)();
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
    registerModule(module) {
        this.modules.set(module.name, module);
        console.log(`[GATEWAY] Registered module: ${module.name} v${module.version}`);
    }
    /**
     * Get the gateway router
     */
    getRouter() {
        return this.router;
    }
    /**
     * Setup core gateway routes
     */
    setupCoreRoutes() {
        // Health check endpoint
        this.router.get('/health', async (_req, res) => {
            const health = await this.aggregateHealth();
            let overallStatus = 'healthy';
            if (health.some((h) => h.status === 'unhealthy')) {
                overallStatus = 'unhealthy';
            }
            else if (health.some((h) => h.status === 'degraded')) {
                overallStatus = 'degraded';
            }
            res.json({
                status: overallStatus,
                timestamp: new Date().toISOString(),
                modules: health
            });
        });
        // Module info endpoint
        this.router.get('/modules', (_req, res) => {
            const modules = Array.from(this.modules.values()).map((m) => ({
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
            this.router.get('/metrics', (_req, res) => {
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
    async aggregateHealth() {
        const healthPromises = Array.from(this.modules.values()).map(async (module) => {
            try {
                return await module.healthCheck();
            }
            catch (error) {
                return {
                    module: module.name,
                    status: 'unhealthy',
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
    static requestLogger() {
        return (req, _res, next) => {
            console.log(`[GATEWAY] ${req.method} ${req.path}`);
            next();
        };
    }
    /**
     * Middleware for rate limiting (simple in-memory implementation)
     */
    static rateLimiter(maxRequests, windowMs) {
        const requests = new Map();
        return (req, res, next) => {
            const ip = req.ip ?? 'unknown';
            const now = Date.now();
            const record = requests.get(ip);
            if (!record || now > record.resetTime) {
                requests.set(ip, { count: 1, resetTime: now + windowMs });
                next();
            }
            else if (record.count < maxRequests) {
                record.count++;
                next();
            }
            else {
                res.status(429).json({ error: 'Too many requests' });
            }
        };
    }
}
exports.ApiGateway = ApiGateway;
/**
 * Create module health check helper
 */
function createHealthCheck(moduleName, checkFn) {
    return async () => {
        try {
            const isHealthy = checkFn ? await checkFn() : true;
            return {
                module: moduleName,
                status: isHealthy ? 'healthy' : 'degraded',
                timestamp: new Date()
            };
        }
        catch (error) {
            console.debug(`[HEALTH] Module ${moduleName} health check failed:`, error);
            return {
                module: moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    };
}
//# sourceMappingURL=api-gateway.js.map