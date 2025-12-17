"use strict";
/**
 * Material Module Installer
 * Encapsulates all material module dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialInstaller = void 0;
const material_1 = require("../../modules/material");
const material_service_handler_1 = require("../../modules/material/material.service-handler");
const material_event_handler_1 = require("../../modules/material/material.event-handler");
exports.materialInstaller = {
    name: 'material',
    install(context) {
        const { db, registry, authMiddleware } = context;
        // Repository layer
        const repository = new material_1.MaterialRepository(db);
        // Service handler for inter-module communication
        const serviceHandler = new material_service_handler_1.MaterialServiceHandler(repository);
        registry.register('material', serviceHandler);
        // Event handler for async events
        const eventHandler = new material_event_handler_1.MaterialEventHandler(repository);
        eventHandler.register();
        // Application service
        const service = new material_1.MaterialService(repository);
        // Controller (HTTP layer)
        const controller = new material_1.MaterialController(service);
        return {
            router: controller.router,
            path: '/api/materials',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=material.installer.js.map