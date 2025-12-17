/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * All dependencies are wired up here at the composition root
 */

import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'node:http';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, closeDb, Database } from './db';

// Modules
import { MaterialRepository, MaterialService, MaterialController } from './modules/material';
import { StockRepository, StockService, StockController } from './modules/stock';
import { UserRepository, AuthService, AuthController, IAuthConfig } from './modules/auth';
import { OrderRepository, OrderService, OrderController } from './modules/order';
import {
    OptimizationRepository,
    OptimizationService,
    OptimizationController,

} from './modules/optimization';
import { OptimizationConsumer } from './modules/optimization/optimization.consumer';
import { ProductionRepository, ProductionService, ProductionController } from './modules/production';
import { ReportRepository, ReportService, ReportController } from './modules/report';
import { CuttingJobRepository, CuttingJobService, CuttingJobController } from './modules/cutting-job';
import { ImportRepository, ImportService, ImportController } from './modules/import';
import { MachineRepository, MachineService, MachineController } from './modules/machine';
import { CustomerRepository, CustomerService, CustomerController } from './modules/customer';
import { LocationRepository, LocationService, LocationController } from './modules/location';
import { ExportRepository, ExportController } from './modules/export';
import { DashboardRepository, DashboardService, DashboardController } from './modules/dashboard';

// Health
import { getHealthController } from './controllers/health.controller';

// WebSocket
import { websocketService } from './websocket';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { createAuthMiddleware } from './middleware/authMiddleware';
import { metricsMiddleware } from './middleware/metrics.middleware';
import { defaultRateLimiter, authRateLimiter, optimizationRateLimiter } from './middleware/rate-limit.middleware';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware';
import { compressionMiddleware } from './middleware/compression.middleware';
import { defaultTimeout, optimizationTimeout } from './middleware/timeout.middleware';
import { requestLoggingMiddleware } from './middleware/request-logging.middleware';

// Monitoring
import { getMetrics, getMetricsContentType } from './core/monitoring';

// Interfaces
import { IAuthService } from './core/interfaces';

// Config
import { getConfig } from './core/config';

// Services (Microservice Infrastructure)
import { ServiceRegistry, createOptimizationClient, createStockClient, createCuttingJobClient, createStockQueryClient } from './core/services';
import { OptimizationServiceHandler } from './modules/optimization/optimization.service-handler';
import { StockServiceHandler } from './modules/stock/stock.service-handler';
import { OrderServiceHandler } from './modules/order/order.service-handler';
import { MaterialServiceHandler } from './modules/material/material.service-handler';
import { MachineServiceHandler } from './modules/machine/machine.service-handler';
import { CustomerServiceHandler } from './modules/customer/customer.service-handler';
import { CuttingJobServiceHandler } from './modules/cutting-job/cutting-job.service-handler';
import { AuthServiceHandler } from './modules/auth/auth.service-handler';
import { LocationServiceHandler } from './modules/location/location.service-handler';

// Event Handlers (Event-Driven Architecture)
import { StockEventHandler } from './modules/stock/stock.event-handler';
import { OptimizationEventHandler } from './modules/optimization/optimization.event-handler';
import { OrderEventHandler } from './modules/order/order.event-handler';
import { ProductionEventHandler } from './modules/production/production.event-handler';
import { MaterialEventHandler } from './modules/material/material.event-handler';
import { MachineEventHandler } from './modules/machine/machine.event-handler';
import { CuttingJobEventHandler } from './modules/cutting-job/cutting-job.event-handler';

// Messaging (RabbitMQ / In-Memory)
import { initializeMessageBus, shutdownMessageBus } from './core/messaging';

dotenv.config();

/**
 * Application class - Single Responsibility: Application lifecycle management
 */
export class Application {
    private readonly app: Express;
    private readonly httpServer: HttpServer;
    private readonly db: Database;
    private readonly port: number;

    // Services stored as class properties for route initialization
    private materialService!: MaterialService;
    private stockService!: StockService;
    private authService!: AuthService;
    private orderService!: OrderService;
    private optimizationService!: OptimizationService;
    private productionService!: ProductionService;
    private reportService!: ReportService;
    private cuttingJobService!: CuttingJobService;
    private importService!: ImportService;
    private machineService!: MachineService;
    private customerService!: CustomerService;
    private locationService!: LocationService;

    constructor() {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.db = getDb();
        this.port = Number.parseInt(process.env.PORT ?? '3000', 10);
    }

    /**
     * Initialize all dependencies - Composition Root
     */
    private initializeDependencies(): void {
        // Auth configuration - uses centralized config (JWT_SECRET required)
        const config = getConfig();
        const authConfig: IAuthConfig = {
            jwtSecret: config.jwt.secret,
            jwtExpiresIn: config.jwt.expiresIn,
            saltRounds: 10
        };

        // Initialize repositories
        const materialRepository = new MaterialRepository(this.db);
        const stockRepository = new StockRepository(this.db);
        const userRepository = new UserRepository(this.db);
        const orderRepository = new OrderRepository(this.db);
        const optimizationRepository = new OptimizationRepository(this.db);
        const productionRepository = new ProductionRepository(this.db);
        const reportRepository = new ReportRepository(this.db);
        const cuttingJobRepository = new CuttingJobRepository(this.db);
        const machineRepository = new MachineRepository(this.db);
        const customerRepository = new CustomerRepository(this.db);
        const locationRepository = new LocationRepository(this.db);

        // Initialize strategy registry


        // ==================== MICROSERVICE INFRASTRUCTURE ====================
        // Create service handlers for inter-module communication
        const serviceRegistry = ServiceRegistry.getInstance();

        // Register optimization service handler
        const optimizationServiceHandler = new OptimizationServiceHandler(optimizationRepository);
        serviceRegistry.register('optimization', optimizationServiceHandler);

        // Register stock service handler
        const stockServiceHandler = new StockServiceHandler(stockRepository);
        serviceRegistry.register('stock', stockServiceHandler);

        // Register order service handler
        const orderServiceHandler = new OrderServiceHandler(orderRepository);
        serviceRegistry.register('order', orderServiceHandler);

        // Register material service handler
        const materialServiceHandler = new MaterialServiceHandler(materialRepository);
        serviceRegistry.register('material', materialServiceHandler);

        // Register machine service handler
        const machineServiceHandler = new MachineServiceHandler(machineRepository);
        serviceRegistry.register('machine', machineServiceHandler);

        // Register customer service handler
        const customerServiceHandler = new CustomerServiceHandler(customerRepository);
        serviceRegistry.register('customer', customerServiceHandler);

        // Register cutting-job service handler
        const cuttingJobServiceHandler = new CuttingJobServiceHandler(cuttingJobRepository);
        serviceRegistry.register('cutting-job', cuttingJobServiceHandler);

        // Register auth service handler
        const authServiceHandler = new AuthServiceHandler(userRepository);
        serviceRegistry.register('auth', authServiceHandler);

        // Register location service handler
        const locationServiceHandler = new LocationServiceHandler(locationRepository);
        serviceRegistry.register('location', locationServiceHandler);

        // Create service clients for cross-module access
        const optimizationClient = createOptimizationClient(serviceRegistry);
        const stockClient = createStockClient(serviceRegistry);
        const cuttingJobClient = createCuttingJobClient(serviceRegistry);
        const stockQueryClient = createStockQueryClient(serviceRegistry);

        // ==================== SERVICES ====================
        // Initialize services with dependencies (DIP)
        this.materialService = new MaterialService(materialRepository);
        this.stockService = new StockService(stockRepository);
        this.authService = new AuthService(userRepository, authConfig);
        this.orderService = new OrderService(orderRepository);
        this.optimizationService = new OptimizationService(optimizationRepository, cuttingJobClient, stockQueryClient);

        // ProductionService uses service clients instead of cross-module repositories
        this.productionService = new ProductionService(productionRepository, optimizationClient, stockClient);

        this.reportService = new ReportService(reportRepository);
        this.cuttingJobService = new CuttingJobService(cuttingJobRepository);
        const importRepository = new ImportRepository(this.db);
        this.importService = new ImportService(importRepository);
        this.machineService = new MachineService(machineRepository);
        this.customerService = new CustomerService(customerRepository);
        this.locationService = new LocationService(locationRepository);

        // ==================== EVENT HANDLERS ====================
        // Register event handlers for cross-module async communication
        const stockEventHandler = new StockEventHandler(stockRepository);
        stockEventHandler.register();

        const optimizationEventHandler = new OptimizationEventHandler(optimizationRepository);
        optimizationEventHandler.register();

        const orderEventHandler = new OrderEventHandler(orderRepository);
        orderEventHandler.register();

        const productionEventHandler = new ProductionEventHandler(productionRepository);
        productionEventHandler.register();

        const materialEventHandler = new MaterialEventHandler(materialRepository);
        materialEventHandler.register();

        const machineEventHandler = new MachineEventHandler(machineRepository);
        machineEventHandler.register();

        const cuttingJobEventHandler = new CuttingJobEventHandler(cuttingJobRepository);
        cuttingJobEventHandler.register();

        // ==================== RABBITMQ CONSUMERS ====================
        // Register RabbitMQ consumers for async optimization requests
        const optimizationConsumer = new OptimizationConsumer(this.optimizationService.getEngine());
        optimizationConsumer.register();
    }

    /**
     * Initialize Express middleware
     */
    private initializeMiddleware(): void {
        // Security headers first
        this.app.use(securityHeadersMiddleware);

        // Request ID for tracing
        this.app.use(requestIdMiddleware);

        // Compression (before other middleware)
        this.app.use(compressionMiddleware);

        // CORS
        this.app.use(cors());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use(requestLoggingMiddleware);

        // Global rate limiting
        this.app.use(defaultRateLimiter);

        // Default timeout
        this.app.use(defaultTimeout);

        // Prometheus metrics middleware
        this.app.use(metricsMiddleware);

        // Metrics endpoint for Prometheus scraping
        this.app.get('/metrics', async (_req, res) => {
            try {
                const metrics = await getMetrics();
                res.set('Content-Type', getMetricsContentType());
                res.send(metrics);
            } catch (error) {
                console.error('[METRICS] Error collecting metrics:', error);
                res.status(500).send('Error collecting metrics');
            }
        });
    }

    /**
     * Initialize routes with dependency injection
     */
    private initializeRoutes(): void {
        // Create controllers with injected services
        const materialController = new MaterialController(this.materialService);
        const stockController = new StockController(this.stockService);
        const authController = new AuthController(this.authService);
        const orderController = new OrderController(this.orderService);
        const optimizationController = new OptimizationController(this.optimizationService);
        const productionController = new ProductionController(this.productionService);
        const reportController = new ReportController(this.reportService);
        const cuttingJobController = new CuttingJobController(this.cuttingJobService);
        const importController = new ImportController(this.importService);
        const machineController = new MachineController(this.machineService);
        const customerController = new CustomerController(this.customerService);
        const locationController = new LocationController(this.locationService);
        // Export module with repository injection
        const exportRepository = new ExportRepository(this.db);
        const exportController = new ExportController(exportRepository);

        // Dashboard module with repository -> service -> controller injection
        const dashboardRepository = new DashboardRepository(this.db);
        const dashboardService = new DashboardService(dashboardRepository);
        const dashboardController = new DashboardController(dashboardService);

        // Create auth middleware with proper type
        const authMiddleware = createAuthMiddleware(this.authService as IAuthService);

        // Health check endpoints (public)
        const healthController = getHealthController();
        this.app.use(healthController.router);

        // Public routes (with stricter rate limiting)
        this.app.use('/api/auth', authRateLimiter, authController.router);

        // Protected routes
        this.app.use('/api/materials', authMiddleware, materialController.router);
        this.app.use('/api/stock', authMiddleware, stockController.router);
        this.app.use('/api/orders', authMiddleware, orderController.router);
        this.app.use('/api/optimization', authMiddleware, optimizationRateLimiter, optimizationTimeout, optimizationController.router);
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
    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    /**
     * Connect to database
     */
    private async connectDatabase(): Promise<void> {
        try {
            // Drizzle uses connection pooling - connection is established on first query
            console.log('✅ Database connection pool ready');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }

    /**
     * Start the application
     */
    public async start(): Promise<void> {
        await this.connectDatabase();

        // Initialize Message Bus (RabbitMQ or In-Memory based on config)
        // Must be done BEFORE dependencies because event handlers use the adapter
        try {
            await initializeMessageBus();
            console.log('✅ Message bus initialized');
        } catch (error) {
            console.warn('⚠️ Message bus initialization failed, using in-memory fallback:', error);
        }

        this.initializeDependencies();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();

        // Initialize WebSocket
        websocketService.initialize(this.httpServer);

        // Initialize Worker Pool for optimization calculations
        if (this.optimizationService) {
            await this.optimizationService.initializeWorkers();
            console.log('✅ Worker pool initialized');
        }

        this.httpServer.listen(this.port, () => {
            console.log(`🚀 Nestra server running on http://localhost:${this.port}`);
            console.log(`📚 Environment: ${process.env.NODE_ENV ?? 'development'}`);
            console.log('🔌 WebSocket available at /ws');
            console.log(`📨 Message Bus: ${process.env.USE_RABBITMQ === 'true' ? 'RabbitMQ' : 'In-Memory'}`);
        });
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        console.log('🛑 Shutting down...');

        // Shutdown message bus
        await shutdownMessageBus();
        console.log('✅ Message bus disconnected');

        // Shutdown worker pool
        const { shutdownOptimizationPool } = await import('./workers');
        await shutdownOptimizationPool();
        console.log('✅ Worker pool terminated');

        await closeDb();
        console.log('✅ Database disconnected');
    }
}

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
    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
};

void bootstrap();

export default app;
