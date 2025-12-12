"use strict";
/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * All dependencies are wired up here at the composition root
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Application = void 0;
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Modules
const material_1 = require("./modules/material");
const stock_1 = require("./modules/stock");
const auth_1 = require("./modules/auth");
const order_1 = require("./modules/order");
const optimization_1 = require("./modules/optimization");
const production_1 = require("./modules/production");
const report_1 = require("./modules/report");
const cutting_job_1 = require("./modules/cutting-job");
const import_1 = require("./modules/import");
const machine_1 = require("./modules/machine");
const customer_1 = require("./modules/customer");
const location_1 = require("./modules/location");
const export_1 = require("./modules/export");
const dashboard_1 = require("./modules/dashboard");
// WebSocket
const websocket_1 = require("./websocket");
// Middleware
const errorHandler_1 = require("./middleware/errorHandler");
const authMiddleware_1 = require("./middleware/authMiddleware");
// Services (Microservice Infrastructure)
const services_1 = require("./core/services");
const optimization_service_handler_1 = require("./modules/optimization/optimization.service-handler");
const stock_service_handler_1 = require("./modules/stock/stock.service-handler");
const order_service_handler_1 = require("./modules/order/order.service-handler");
const material_service_handler_1 = require("./modules/material/material.service-handler");
const machine_service_handler_1 = require("./modules/machine/machine.service-handler");
const customer_service_handler_1 = require("./modules/customer/customer.service-handler");
const cutting_job_service_handler_1 = require("./modules/cutting-job/cutting-job.service-handler");
// Event Handlers (Event-Driven Architecture)
const stock_event_handler_1 = require("./modules/stock/stock.event-handler");
const optimization_event_handler_1 = require("./modules/optimization/optimization.event-handler");
const order_event_handler_1 = require("./modules/order/order.event-handler");
dotenv_1.default.config();
/**
 * Application class - Single Responsibility: Application lifecycle management
 */
class Application {
    app;
    httpServer;
    prisma;
    port;
    // Services stored as class properties for route initialization
    materialService;
    stockService;
    authService;
    orderService;
    optimizationService;
    productionService;
    reportService;
    cuttingJobService;
    importService;
    machineService;
    customerService;
    locationService;
    constructor() {
        this.app = (0, express_1.default)();
        this.httpServer = (0, node_http_1.createServer)(this.app);
        this.prisma = new client_1.PrismaClient();
        this.port = Number.parseInt(process.env.PORT ?? '3000', 10);
    }
    /**
     * Initialize all dependencies - Composition Root
     */
    initializeDependencies() {
        // Auth configuration
        const authConfig = {
            jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
            saltRounds: 10
        };
        // Initialize repositories
        const materialRepository = new material_1.MaterialRepository(this.prisma);
        const stockRepository = new stock_1.StockRepository(this.prisma);
        const userRepository = new auth_1.UserRepository(this.prisma);
        const orderRepository = new order_1.OrderRepository(this.prisma);
        const optimizationRepository = new optimization_1.OptimizationRepository(this.prisma);
        const productionRepository = new production_1.ProductionRepository(this.prisma);
        const reportRepository = new report_1.ReportRepository(this.prisma);
        const cuttingJobRepository = new cutting_job_1.CuttingJobRepository(this.prisma);
        const machineRepository = new machine_1.MachineRepository(this.prisma);
        const customerRepository = new customer_1.CustomerRepository(this.prisma);
        const locationRepository = new location_1.LocationRepository(this.prisma);
        // Initialize strategy registry
        // ==================== MICROSERVICE INFRASTRUCTURE ====================
        // Create service handlers for inter-module communication
        const serviceRegistry = services_1.ServiceRegistry.getInstance();
        // Register optimization service handler
        const optimizationServiceHandler = new optimization_service_handler_1.OptimizationServiceHandler(optimizationRepository);
        serviceRegistry.register('optimization', optimizationServiceHandler);
        // Register stock service handler
        const stockServiceHandler = new stock_service_handler_1.StockServiceHandler(stockRepository);
        serviceRegistry.register('stock', stockServiceHandler);
        // Register order service handler
        const orderServiceHandler = new order_service_handler_1.OrderServiceHandler(orderRepository);
        serviceRegistry.register('order', orderServiceHandler);
        // Register material service handler
        const materialServiceHandler = new material_service_handler_1.MaterialServiceHandler(materialRepository);
        serviceRegistry.register('material', materialServiceHandler);
        // Register machine service handler
        const machineServiceHandler = new machine_service_handler_1.MachineServiceHandler(machineRepository);
        serviceRegistry.register('machine', machineServiceHandler);
        // Register customer service handler
        const customerServiceHandler = new customer_service_handler_1.CustomerServiceHandler(customerRepository);
        serviceRegistry.register('customer', customerServiceHandler);
        // Register cutting-job service handler
        const cuttingJobServiceHandler = new cutting_job_service_handler_1.CuttingJobServiceHandler(cuttingJobRepository);
        serviceRegistry.register('cutting-job', cuttingJobServiceHandler);
        // Create service clients for cross-module access
        const optimizationClient = (0, services_1.createOptimizationClient)(serviceRegistry);
        const stockClient = (0, services_1.createStockClient)(serviceRegistry);
        // ==================== SERVICES ====================
        // Initialize services with dependencies (DIP)
        this.materialService = new material_1.MaterialService(materialRepository);
        this.stockService = new stock_1.StockService(stockRepository);
        this.authService = new auth_1.AuthService(userRepository, authConfig);
        this.orderService = new order_1.OrderService(orderRepository);
        this.optimizationService = new optimization_1.OptimizationService(optimizationRepository, this.prisma);
        // ProductionService uses service clients instead of cross-module repositories
        this.productionService = new production_1.ProductionService(productionRepository, optimizationClient, stockClient);
        this.reportService = new report_1.ReportService(reportRepository);
        this.cuttingJobService = new cutting_job_1.CuttingJobService(cuttingJobRepository);
        const importRepository = new import_1.ImportRepository(this.prisma);
        this.importService = new import_1.ImportService(importRepository);
        this.machineService = new machine_1.MachineService(machineRepository);
        this.customerService = new customer_1.CustomerService(customerRepository);
        this.locationService = new location_1.LocationService(locationRepository);
        // ==================== EVENT HANDLERS ====================
        // Register event handlers for cross-module async communication
        const stockEventHandler = new stock_event_handler_1.StockEventHandler(stockRepository);
        stockEventHandler.register();
        const optimizationEventHandler = new optimization_event_handler_1.OptimizationEventHandler(optimizationRepository);
        optimizationEventHandler.register();
        const orderEventHandler = new order_event_handler_1.OrderEventHandler(orderRepository);
        orderEventHandler.register();
    }
    /**
     * Initialize Express middleware
     */
    initializeMiddleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
    }
    /**
     * Initialize routes with dependency injection
     */
    initializeRoutes() {
        // Create controllers with injected services
        const materialController = new material_1.MaterialController(this.materialService);
        const stockController = new stock_1.StockController(this.stockService);
        const authController = new auth_1.AuthController(this.authService);
        const orderController = new order_1.OrderController(this.orderService);
        const optimizationController = new optimization_1.OptimizationController(this.optimizationService);
        const productionController = new production_1.ProductionController(this.productionService);
        const reportController = new report_1.ReportController(this.reportService);
        const cuttingJobController = new cutting_job_1.CuttingJobController(this.cuttingJobService);
        const importController = new import_1.ImportController(this.importService);
        const machineController = new machine_1.MachineController(this.machineService);
        const customerController = new customer_1.CustomerController(this.customerService);
        const locationController = new location_1.LocationController(this.locationService);
        // Export module with repository injection
        const exportRepository = new export_1.ExportRepository(this.prisma);
        const exportController = new export_1.ExportController(exportRepository);
        // Dashboard module with repository -> service -> controller injection
        const dashboardRepository = new dashboard_1.DashboardRepository(this.prisma);
        const dashboardService = new dashboard_1.DashboardService(dashboardRepository);
        const dashboardController = new dashboard_1.DashboardController(dashboardService);
        // Create auth middleware with proper type
        const authMiddleware = (0, authMiddleware_1.createAuthMiddleware)(this.authService);
        // Health check (public)
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        // Public routes
        this.app.use('/api/auth', authController.router);
        // Protected routes
        this.app.use('/api/materials', authMiddleware, materialController.router);
        this.app.use('/api/stock', authMiddleware, stockController.router);
        this.app.use('/api/orders', authMiddleware, orderController.router);
        this.app.use('/api/optimization', authMiddleware, optimizationController.router);
        this.app.use('/api/production', authMiddleware, productionController.router);
        this.app.use('/api/reports', authMiddleware, reportController.router);
        this.app.use('/api/cutting-jobs', authMiddleware, cuttingJobController.router);
        this.app.use('/api/import', authMiddleware, importController.router);
        this.app.use('/api/machines', authMiddleware, machineController.router);
        this.app.use('/api/customers', authMiddleware, customerController.router);
        this.app.use('/api/locations', authMiddleware, locationController.router);
        this.app.use('/api/export', authMiddleware, exportController.router);
        this.app.use('/api/dashboard', authMiddleware, dashboardController.router);
    }
    /**
     * Initialize error handling
     */
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    /**
     * Connect to database
     */
    async connectDatabase() {
        try {
            await this.prisma.$connect();
            console.log('✅ Database connected');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }
    /**
     * Start the application
     */
    async start() {
        await this.connectDatabase();
        this.initializeDependencies();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
        // Initialize WebSocket
        websocket_1.websocketService.initialize(this.httpServer);
        this.httpServer.listen(this.port, () => {
            console.log(`🚀 Nestra server running on http://localhost:${this.port}`);
            console.log(`📚 Environment: ${process.env.NODE_ENV ?? 'development'}`);
            console.log('🔌 WebSocket available at /ws');
        });
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down...');
        await this.prisma.$disconnect();
        console.log('✅ Database disconnected');
    }
}
exports.Application = Application;
const app = new Application();
process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
});
const bootstrap = async () => {
    try {
        await app.start();
    }
    catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
};
void bootstrap();
exports.default = app;
//# sourceMappingURL=index.js.map