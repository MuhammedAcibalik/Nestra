"use strict";
/**
 * Optimization Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizationInstaller = void 0;
const optimization_1 = require("../../modules/optimization");
const optimization_consumer_1 = require("../../modules/optimization/optimization.consumer");
const optimization_service_handler_1 = require("../../modules/optimization/optimization.service-handler");
const optimization_event_handler_1 = require("../../modules/optimization/optimization.event-handler");
const services_1 = require("../services");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const timeout_middleware_1 = require("../../middleware/timeout.middleware");
exports.optimizationInstaller = {
    name: 'optimization',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new optimization_1.OptimizationRepository(db);
        // Service handler registration
        const serviceHandler = new optimization_service_handler_1.OptimizationServiceHandler(repository);
        registry.register('optimization', serviceHandler);
        // Event handler
        const eventHandler = new optimization_event_handler_1.OptimizationEventHandler(repository);
        eventHandler.register();
        // Service clients for cross-module access
        const cuttingJobClient = (0, services_1.createCuttingJobClient)(registry);
        const stockQueryClient = (0, services_1.createStockQueryClient)(registry);
        // Service with injected clients
        const service = new optimization_1.OptimizationService(repository, cuttingJobClient, stockQueryClient);
        // RabbitMQ consumer
        const consumer = new optimization_consumer_1.OptimizationConsumer(service.getEngine());
        consumer.register();
        const controller = new optimization_1.OptimizationController(service);
        return {
            router: controller.router,
            path: '/api/optimization',
            middleware: [authMiddleware, rate_limit_middleware_1.optimizationRateLimiter, timeout_middleware_1.optimizationTimeout],
            service
        };
    }
};
//# sourceMappingURL=optimization.installer.js.map