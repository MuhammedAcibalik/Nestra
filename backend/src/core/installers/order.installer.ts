/**
 * Order Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { OrderRepository, OrderService, OrderController } from '../../modules/order';
import { OrderServiceHandler } from '../../modules/order/order.service-handler';
import { OrderEventHandler } from '../../modules/order/order.event-handler';

export const orderInstaller: IModuleInstaller = {
    name: 'order',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        const repository = new OrderRepository(db);

        const serviceHandler = new OrderServiceHandler(repository);
        registry.register('order', serviceHandler);

        const eventHandler = new OrderEventHandler(repository);
        eventHandler.register();

        const service = new OrderService(repository);
        const controller = new OrderController(service);

        return {
            router: controller.router,
            path: '/api/orders',
            middleware: [authMiddleware],
            service
        };
    }
};
