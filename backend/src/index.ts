/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * Simplified entry point using modular bootstrap configuration
 */

// MUST be first - load environment variables before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'node:http';
import { getDb, closeDb, Database } from './db';

// Bootstrap modules
import {
    initializeDependencies,
    initializeMiddleware,
    initializeRoutes,
    initializeErrorHandling,
    IAppServices
} from './bootstrap';

// WebSocket
import { websocketService } from './websocket';

// Messaging (RabbitMQ / In-Memory)
import { initializeMessageBus, shutdownMessageBus } from './core/messaging';

// Cache
import { initializeCache, shutdownCache, getCache } from './core/cache';

// Error Tracking
import { initializeSentryFromEnv, flushSentry } from './core/error-tracking';

// Job Queue
import { initializeJobQueue, shutdownJobQueue, isJobQueueEnabled, setupOptimizationQueue } from './core/jobs';

// Tracing (initialized via bootstrap file for proper auto-instrumentation)
import { isTracingEnabled, shutdownTracing } from './core/tracing';
import { createModuleLogger } from './core/logger';

const logger = createModuleLogger('Application');

/**
 * Application class - Single Responsibility: Application lifecycle management
 */
export class Application {
    private readonly app: Express;
    private readonly httpServer: HttpServer;
    private readonly db: Database;
    private readonly port: number;
    private services!: IAppServices;

    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.db = getDb();
        this.port = Number.parseInt(process.env.PORT ?? '3000', 10);
    }

    /**
     * Connect to database
     */
    private async connectDatabase(): Promise<void> {
        try {
            // Drizzle uses connection pooling - connection is established on first query
            logger.info('Database connection pool ready');
        } catch (error) {
            logger.error('Database connection failed', { error });
            process.exit(1);
        }
    }

    /**
     * Start the application
     */
    public async start(): Promise<void> {
        await this.connectDatabase();

        // Initialize Error Tracking (Sentry)
        initializeSentryFromEnv();

        // Initialize Cache (Redis or In-Memory fallback)
        try {
            const cache = await initializeCache();
            logger.info('Cache initialized', { type: cache.isConnected() ? 'Redis' : 'In-Memory' });
        } catch (error) {
            logger.warn('Cache initialization failed, using in-memory fallback', { error });
        }

        // Initialize Message Bus (RabbitMQ or In-Memory based on config)
        try {
            await initializeMessageBus();
            logger.info('Message bus initialized');
        } catch (error) {
            logger.warn('Message bus initialization failed, using in-memory fallback', { error });
        }

        // Initialize dependencies using DI container
        this.services = initializeDependencies(this.db);

        // Initialize middleware
        initializeMiddleware(this.app);

        // Initialize routes
        initializeRoutes(this.app, this.services, this.db);

        // Initialize error handling (must be last)
        initializeErrorHandling(this.app);

        // Initialize WebSocket
        websocketService.initialize(this.httpServer);

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
                cache: getCache()?.isConnected() ? 'Redis' : 'In-Memory',
                jobQueue: isJobQueueEnabled() ? 'BullMQ' : 'Disabled',
                tracing: isTracingEnabled() ? 'OpenTelemetry' : 'Disabled'
            });
        });
    }

    /**
     * Initialize job queue with optimization processor
     */
    private async initializeJobQueue(): Promise<void> {
        try {
            await initializeJobQueue();
            // Setup optimization queue processor
            if (this.services.optimizationService) {
                setupOptimizationQueue(
                    async (scenarioId: string) => {
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
                    },
                    (userId, scenarioId, status, progress) => {
                        // WebSocket notification
                        websocketService.emitOptimizationProgress({
                            scenarioId,
                            progress,
                            message: status
                        });
                    }
                );
            }
            logger.info('Job queue initialized');
        } catch (error) {
            logger.warn('Job queue initialization failed', { error });
        }
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        logger.info('Shutting down...');

        // Flush Sentry events before shutdown
        await flushSentry();
        logger.debug('Error tracking flushed');

        // Shutdown cache
        await shutdownCache();
        logger.debug('Cache disconnected');

        // Shutdown job queue
        await shutdownJobQueue();
        logger.debug('Job queue disconnected');

        // Shutdown message bus
        await shutdownMessageBus();
        logger.debug('Message bus disconnected');

        // Shutdown worker pool
        const { shutdownOptimizationPool } = await import('./workers');
        await shutdownOptimizationPool();
        logger.debug('Worker pool terminated');

        await closeDb();
        logger.debug('Database disconnected');

        // Shutdown tracing
        await shutdownTracing();
        logger.info('Shutdown complete');
    }
}

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
    } catch (error) {
        logger.error('Failed to start application', { error });
        process.exit(1);
    }
};

void bootstrap();

export default app;
