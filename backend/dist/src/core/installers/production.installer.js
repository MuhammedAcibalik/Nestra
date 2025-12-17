"use strict";
/**
 * Production Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionInstaller = void 0;
const production_1 = require("../../modules/production");
const production_event_handler_1 = require("../../modules/production/production.event-handler");
const services_1 = require("../services");
exports.productionInstaller = {
    name: 'production',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new production_1.ProductionRepository(db);
        // Event handler
        const eventHandler = new production_event_handler_1.ProductionEventHandler(repository);
        eventHandler.register();
        // Service clients for cross-module access
        const optimizationClient = (0, services_1.createOptimizationClient)(registry);
        const stockClient = (0, services_1.createStockClient)(registry);
        const service = new production_1.ProductionService(repository, optimizationClient, stockClient);
        const controller = new production_1.ProductionController(service);
        return {
            router: controller.router,
            path: '/api/production',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=production.installer.js.map