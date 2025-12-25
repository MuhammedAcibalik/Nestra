"use strict";
/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * Simplified entry point using modular bootstrap configuration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
// MUST be first - load environment variables before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const db_1 = require("./db");
// Bootstrap modules
const bootstrap_1 = require("./bootstrap");
// WebSocket
const websocket_1 = require("./websocket");
// Messaging (RabbitMQ / In-Memory)
const messaging_1 = require("./core/messaging");
// Cache
const cache_1 = require("./core/cache");
// Error Tracking
const error_tracking_1 = require("./core/error-tracking");
// Job Queue
const jobs_1 = require("./core/jobs");
// Tracing (initialized via bootstrap file for proper auto-instrumentation)
const tracing_1 = require("./core/tracing");
const logger_1 = require("./core/logger");
const logger = (0, logger_1.createModuleLogger)('Application');
/**
 * Application class - Single Responsibility: Application lifecycle management
 */
class Application {
    app;
    httpServer;
    db;
    port;
    services;
    constructor() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, node_http_1.createServer)(this.app);
        this.db = (0, db_1.getDb)();
        this.port = Number.parseInt(process.env.PORT ?? '3000', 10);
    }
    /**
     * Connect to database
     */
    async connectDatabase() {
        try {
            // Drizzle uses connection pooling - connection is established on first query
            logger.info('Database connection pool ready');
        }
        catch (error) {
            logger.error('Database connection failed', { error });
            process.exit(1);
        }
    }
    /**
     * Start the application
     */
    async start() {
        await this.connectDatabase();
        // Initialize Error Tracking (Sentry)
        (0, error_tracking_1.initializeSentryFromEnv)();
        // Initialize Cache (Redis or In-Memory fallback)
        try {
            const cache = await (0, cache_1.initializeCache)();
            logger.info('Cache initialized', { type: cache.isConnected() ? 'Redis' : 'In-Memory' });
        }
        catch (error) {
            logger.warn('Cache initialization failed, using in-memory fallback', { error });
        }
        // Initialize Message Bus (RabbitMQ or In-Memory based on config)
        try {
            await (0, messaging_1.initializeMessageBus)();
            logger.info('Message bus initialized');
        }
        catch (error) {
            logger.warn('Message bus initialization failed, using in-memory fallback', { error });
        }
        // Initialize dependencies using DI container
        this.services = (0, bootstrap_1.initializeDependencies)(this.db);
        // Initialize middleware
        (0, bootstrap_1.initializeMiddleware)(this.app);
        // Initialize routes
        (0, bootstrap_1.initializeRoutes)(this.app, this.services, this.db);
        // Initialize error handling (must be last)
        (0, bootstrap_1.initializeErrorHandling)(this.app);
        // Initialize WebSocket
        websocket_1.websocketService.initialize(this.httpServer);
        // Initialize Worker Pool for optimization calculations
        if (this.services.optimizationService) {
            await this.services.optimizationService.initializeWorkers();
            logger.info('Worker pool initialized');
        }
        // Initialize Job Queue (BullMQ) - optional
        if (process.env.USE_JOB_QUEUE === 'true') {
            await this.initializeJobQueue();
        }
        this.httpServer.listen(this.port, () => {
            logger.info('Server started', {
                port: this.port,
                environment: process.env.NODE_ENV ?? 'development',
                messageBus: process.env.USE_RABBITMQ === 'true' ? 'RabbitMQ' : 'In-Memory',
                cache: (0, cache_1.getCache)()?.isConnected() ? 'Redis' : 'In-Memory',
                jobQueue: (0, jobs_1.isJobQueueEnabled)() ? 'BullMQ' : 'Disabled',
                tracing: (0, tracing_1.isTracingEnabled)() ? 'OpenTelemetry' : 'Disabled'
            });
        });
    }
    /**
     * Initialize job queue with optimization processor
     */
    async initializeJobQueue() {
        try {
            await (0, jobs_1.initializeJobQueue)();
            // Setup optimization queue processor
            if (this.services.optimizationService) {
                (0, jobs_1.setupOptimizationQueue)(async (scenarioId) => {
                    const result = await this.services.optimizationService.runOptimization(scenarioId);
                    if (result.success && result.data) {
                        return {
                            success: true,
                            planId: result.data.planId,
                            totalWaste: result.data.totalWaste,
                            wastePercentage: result.data.wastePercentage,
                            stockUsedCount: result.data.stockUsedCount,
                            efficiency: result.data.efficiency
                        };
                    }
                    return { success: false, error: result.error?.message };
                }, (userId, scenarioId, status, progress) => {
                    // WebSocket notification
                    websocket_1.websocketService.emitOptimizationProgress({
                        scenarioId,
                        progress,
                        message: status
                    });
                });
            }
            logger.info('Job queue initialized');
        }
        catch (error) {
            logger.warn('Job queue initialization failed', { error });
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        logger.info('Shutting down...');
        // Flush Sentry events before shutdown
        await (0, error_tracking_1.flushSentry)();
        logger.debug('Error tracking flushed');
        // Shutdown cache
        await (0, cache_1.shutdownCache)();
        logger.debug('Cache disconnected');
        // Shutdown job queue
        await (0, jobs_1.shutdownJobQueue)();
        logger.debug('Job queue disconnected');
        // Shutdown message bus
        await (0, messaging_1.shutdownMessageBus)();
        logger.debug('Message bus disconnected');
        // Shutdown worker pool
        const { shutdownOptimizationPool } = await Promise.resolve().then(() => __importStar(require('./workers')));
        await shutdownOptimizationPool();
        logger.debug('Worker pool terminated');
        await (0, db_1.closeDb)();
        logger.debug('Database disconnected');
        // Shutdown tracing
        await (0, tracing_1.shutdownTracing)();
        logger.info('Shutdown complete');
    }
}
exports.Application = Application;
// Application instance
const app = new Application();
// Signal handlers for graceful shutdown
process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
});
// Bootstrap function
const bootstrap = async () => {
    try {
        await app.start();
    }
    catch (error) {
        logger.error('Failed to start application', { error });
        process.exit(1);
    }
};
void bootstrap();
exports.default = app;
//# sourceMappingURL=index.js.map