"use strict";
/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Composition Root - all dependencies are wired up here
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDependencies = initializeDependencies;
const config_1 = require("../core/config");
const logger_1 = require("../core/logger");
const logger = (0, logger_1.createModuleLogger)('DIContainer');
// Core Services
const services_1 = require("../core/services");
// Material Module
const material_1 = require("../modules/material");
// Stock Module
const stock_1 = require("../modules/stock");
// Auth Module
const auth_1 = require("../modules/auth");
// Order Module
const order_1 = require("../modules/order");
// Optimization Module
const optimization_1 = require("../modules/optimization");
const optimization_consumer_1 = require("../modules/optimization/optimization.consumer");
// Production Module
const production_1 = require("../modules/production");
// Report Module
const report_1 = require("../modules/report");
// CuttingJob Module
const cutting_job_1 = require("../modules/cutting-job");
// Machine Module
const machine_1 = require("../modules/machine");
// Customer Module
const customer_1 = require("../modules/customer");
// Import Module
const import_1 = require("../modules/import");
// Location Module
const location_1 = require("../modules/location");
// Tenant Module
const tenant_1 = require("../modules/tenant");
// Realtime Dashboard Module
const realtime_dashboard_1 = require("../modules/realtime-dashboard");
// Collaboration Module
const collaboration_1 = require("../modules/collaboration");
/**
 * Initialize all dependencies - Composition Root
 */
function initializeDependencies(db) {
    // Auth configuration - uses centralized config (JWT_SECRET required)
    const config = (0, config_1.getConfig)();
    const authConfig = {
        jwtSecret: config.jwt.secret,
        jwtExpiresIn: config.jwt.expiresIn,
        saltRounds: 10
    };
    // Initialize repositories
    const materialRepository = new material_1.MaterialRepository(db);
    const stockRepository = new stock_1.StockRepository(db);
    const userRepository = new auth_1.UserRepository(db);
    const orderRepository = new order_1.OrderRepository(db);
    const optimizationRepository = new optimization_1.OptimizationRepository(db);
    const productionRepository = new production_1.ProductionRepository(db);
    const reportRepository = new report_1.ReportRepository(db);
    const cuttingJobRepository = new cutting_job_1.CuttingJobRepository(db);
    const machineRepository = new machine_1.MachineRepository(db);
    const customerRepository = new customer_1.CustomerRepository(db);
    const locationRepository = new location_1.LocationRepository(db);
    const importRepository = new import_1.ImportRepository(db);
    const tenantRepository = new tenant_1.TenantRepository(db);
    const dashboardRepository = new realtime_dashboard_1.RealtimeDashboardRepository(db);
    const collaborationRepository = new collaboration_1.CollaborationRepository(db);
    // ==================== MICROSERVICE INFRASTRUCTURE ====================
    const serviceRegistry = services_1.ServiceRegistry.getInstance();
    // Register service handlers
    serviceRegistry.register('optimization', new optimization_1.OptimizationServiceHandler(optimizationRepository));
    serviceRegistry.register('stock', new stock_1.StockServiceHandler(stockRepository));
    serviceRegistry.register('order', new order_1.OrderServiceHandler(orderRepository));
    serviceRegistry.register('material', new material_1.MaterialServiceHandler(materialRepository));
    serviceRegistry.register('machine', new machine_1.MachineServiceHandler(machineRepository));
    serviceRegistry.register('customer', new customer_1.CustomerServiceHandler(customerRepository));
    serviceRegistry.register('cutting-job', new cutting_job_1.CuttingJobServiceHandler(cuttingJobRepository));
    serviceRegistry.register('auth', new auth_1.AuthServiceHandler(userRepository));
    serviceRegistry.register('location', new location_1.LocationServiceHandler(locationRepository));
    // Create service clients for cross-module access
    const optimizationClient = (0, services_1.createOptimizationClient)(serviceRegistry);
    const stockClient = (0, services_1.createStockClient)(serviceRegistry);
    const cuttingJobClient = (0, services_1.createCuttingJobClient)(serviceRegistry);
    const stockQueryClient = (0, services_1.createStockQueryClient)(serviceRegistry);
    // ==================== SERVICES ====================
    const services = {
        materialService: new material_1.MaterialService(materialRepository),
        stockService: new stock_1.StockService(stockRepository),
        authService: new auth_1.AuthService(userRepository, authConfig),
        orderService: new order_1.OrderService(orderRepository),
        optimizationService: new optimization_1.OptimizationService(optimizationRepository, cuttingJobClient, stockQueryClient),
        productionService: new production_1.ProductionService(productionRepository, optimizationClient, stockClient),
        reportService: new report_1.ReportService(reportRepository),
        cuttingJobService: new cutting_job_1.CuttingJobService(cuttingJobRepository),
        importService: new import_1.ImportService(importRepository),
        machineService: new machine_1.MachineService(machineRepository),
        customerService: new customer_1.CustomerService(customerRepository),
        locationService: new location_1.LocationService(locationRepository),
        // Multi-tenant & Collaboration services
        tenantService: new tenant_1.TenantService(tenantRepository),
        dashboardService: new realtime_dashboard_1.RealtimeDashboardService(dashboardRepository),
        presenceService: new collaboration_1.PresenceService(),
        documentLockService: new collaboration_1.DocumentLockService(collaborationRepository),
        activityFeedService: new collaboration_1.ActivityFeedService(collaborationRepository)
    };
    // ==================== EVENT HANDLERS ====================
    // Store references for lifecycle management
    const eventHandlers = [
        new stock_1.StockEventHandler(stockRepository),
        new optimization_1.OptimizationEventHandler(optimizationRepository),
        new order_1.OrderEventHandler(orderRepository),
        new production_1.ProductionEventHandler(productionRepository),
        new material_1.MaterialEventHandler(materialRepository),
        new machine_1.MachineEventHandler(machineRepository),
        new cutting_job_1.CuttingJobEventHandler(cuttingJobRepository)
    ];
    eventHandlers.forEach(handler => handler.register());
    logger.info('Event handlers registered', { count: eventHandlers.length });
    // ==================== RABBITMQ CONSUMERS ====================
    const engine = services.optimizationService.getEngine();
    if (engine) {
        new optimization_consumer_1.OptimizationConsumer(engine).register();
    }
    else {
        logger.warn('Optimization engine not available, consumer not registered');
    }
    return services;
}
//# sourceMappingURL=di-container.js.map