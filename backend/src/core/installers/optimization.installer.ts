/**
 * Optimization Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import {
    OptimizationRepository,
    OptimizationService,
    OptimizationController
} from '../../modules/optimization';
import { OptimizationConsumer } from '../../modules/optimization/optimization.consumer';
import { OptimizationServiceHandler } from '../../modules/optimization/optimization.service-handler';
import { OptimizationEventHandler } from '../../modules/optimization/optimization.event-handler';
import { createCuttingJobClient, createStockQueryClient } from '../services';
import { optimizationRateLimiter } from '../../middleware/rate-limit.middleware';
import { optimizationTimeout } from '../../middleware/timeout.middleware';

export const optimizationInstaller: IModuleInstaller = {
    name: 'optimization',

    install(context: IInstallContext): IModuleResult {
        const { prisma, registry, authMiddleware } = context;

        const repository = new OptimizationRepository(prisma);

        // Service handler registration
        const serviceHandler = new OptimizationServiceHandler(repository);
        registry.register('optimization', serviceHandler);

        // Event handler
        const eventHandler = new OptimizationEventHandler(repository);
        eventHandler.register();

        // Service clients for cross-module access
        const cuttingJobClient = createCuttingJobClient(registry);
        const stockQueryClient = createStockQueryClient(registry);

        // Service with injected clients
        const service = new OptimizationService(repository, cuttingJobClient, stockQueryClient);

        // RabbitMQ consumer
        const consumer = new OptimizationConsumer(service.getEngine());
        consumer.register();

        const controller = new OptimizationController(service);

        return {
            router: controller.router,
            path: '/api/optimization',
            middleware: [authMiddleware, optimizationRateLimiter, optimizationTimeout],
            service
        };
    }
};
