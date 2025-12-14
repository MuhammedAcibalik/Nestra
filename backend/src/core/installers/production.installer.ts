/**
 * Production Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { ProductionRepository, ProductionService, ProductionController } from '../../modules/production';
import { ProductionEventHandler } from '../../modules/production/production.event-handler';
import { createOptimizationClient, createStockClient } from '../services';

export const productionInstaller: IModuleInstaller = {
    name: 'production',

    install(context: IInstallContext): IModuleResult {
        const { prisma, registry, authMiddleware } = context;

        const repository = new ProductionRepository(prisma);

        // Event handler
        const eventHandler = new ProductionEventHandler(repository);
        eventHandler.register();

        // Service clients for cross-module access
        const optimizationClient = createOptimizationClient(registry);
        const stockClient = createStockClient(registry);

        const service = new ProductionService(repository, optimizationClient, stockClient);
        const controller = new ProductionController(service);

        return {
            router: controller.router,
            path: '/api/production',
            middleware: [authMiddleware],
            service
        };
    }
};
