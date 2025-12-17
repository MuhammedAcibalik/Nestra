"use strict";
/**
 * Stock Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockInstaller = void 0;
const stock_1 = require("../../modules/stock");
const stock_service_handler_1 = require("../../modules/stock/stock.service-handler");
const stock_event_handler_1 = require("../../modules/stock/stock.event-handler");
exports.stockInstaller = {
    name: 'stock',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new stock_1.StockRepository(db);
        const serviceHandler = new stock_service_handler_1.StockServiceHandler(repository);
        registry.register('stock', serviceHandler);
        const eventHandler = new stock_event_handler_1.StockEventHandler(repository);
        eventHandler.register();
        const service = new stock_1.StockService(repository);
        const controller = new stock_1.StockController(service);
        return {
            router: controller.router,
            path: '/api/stock',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=stock.installer.js.map