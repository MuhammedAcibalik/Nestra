/**
 * Stock Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { StockRepository, StockService, StockController } from '../../modules/stock';
import { StockServiceHandler } from '../../modules/stock/stock.service-handler';
import { StockEventHandler } from '../../modules/stock/stock.event-handler';

export const stockInstaller: IModuleInstaller = {
    name: 'stock',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        const repository = new StockRepository(db);

        const serviceHandler = new StockServiceHandler(repository);
        registry.register('stock', serviceHandler);

        const eventHandler = new StockEventHandler(repository);
        eventHandler.register();

        const service = new StockService(repository);
        const controller = new StockController(service);

        return {
            router: controller.router,
            path: '/api/stock',
            middleware: [authMiddleware],
            service
        };
    }
};
