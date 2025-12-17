"use strict";
/**
 * Order Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderInstaller = void 0;
const order_1 = require("../../modules/order");
const order_service_handler_1 = require("../../modules/order/order.service-handler");
const order_event_handler_1 = require("../../modules/order/order.event-handler");
exports.orderInstaller = {
    name: 'order',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new order_1.OrderRepository(db);
        const serviceHandler = new order_service_handler_1.OrderServiceHandler(repository);
        registry.register('order', serviceHandler);
        const eventHandler = new order_event_handler_1.OrderEventHandler(repository);
        eventHandler.register();
        const service = new order_1.OrderService(repository);
        const controller = new order_1.OrderController(service);
        return {
            router: controller.router,
            path: '/api/orders',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=order.installer.js.map