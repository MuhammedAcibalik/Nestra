/**
 * Application Bootstrap
 * Following Dependency Inversion Principle (DIP)
 * All dependencies are wired up here at the composition root
 */

import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'node:http';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

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
import { ProductionRepository, ProductionService, ProductionController } from './modules/production';
import { ReportRepository, ReportService, ReportController } from './modules/report';
import { CuttingJobRepository, CuttingJobService, CuttingJobController } from './modules/cutting-job';
import { ImportService, ImportController } from './modules/import';
import { MachineRepository, MachineService, MachineController } from './modules/machine';
import { CustomerRepository, CustomerService, CustomerController } from './modules/customer';
import { LocationRepository, LocationService, LocationController } from './modules/location';
import { ExportController } from './modules/export';
import { DashboardController } from './modules/dashboard';

// WebSocket
import { websocketService } from './websocket';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { createAuthMiddleware } from './middleware/authMiddleware';

// Interfaces
import { IAuthService } from './core/interfaces';

// Services (Microservice Infrastructure)
import { ServiceRegistry, createOptimizationClient, createStockClient } from './core/services';
import { OptimizationServiceHandler } from './modules/optimization/optimization.service-handler';
import { StockServiceHandler } from './modules/stock/stock.service-handler';

// Event Handlers (Event-Driven Architecture)
import { StockEventHandler } from './modules/stock/stock.event-handler';
import { OptimizationEventHandler } from './modules/optimization/optimization.event-handler';
import { OrderEventHandler } from './modules/order/order.event-handler';

dotenv.config();

/**
 * Application class - Single Responsibility: Application lifecycle management
 */
export class Application {
    private readonly app: Express;
    private readonly httpServer: HttpServer;
    private readonly prisma: PrismaClient;
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
        this.prisma = new PrismaClient();
        this.port = Number.parseInt(process.env.PORT ?? '3000', 10);
    }

    /**
     * Initialize all dependencies - Composition Root
     */
    private initializeDependencies(): void {
        // Auth configuration
        const authConfig: IAuthConfig = {
            jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
            saltRounds: 10
        };

        // Initialize repositories
        const materialRepository = new MaterialRepository(this.prisma);
        const stockRepository = new StockRepository(this.prisma);
        const userRepository = new UserRepository(this.prisma);
        const orderRepository = new OrderRepository(this.prisma);
        const optimizationRepository = new OptimizationRepository(this.prisma);
        const productionRepository = new ProductionRepository(this.prisma);
        const reportRepository = new ReportRepository(this.prisma);
        const cuttingJobRepository = new CuttingJobRepository(this.prisma);
        const machineRepository = new MachineRepository(this.prisma);
        const customerRepository = new CustomerRepository(this.prisma);
        const locationRepository = new LocationRepository(this.prisma);

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

        // Create service clients for cross-module access
        const optimizationClient = createOptimizationClient(serviceRegistry);
        const stockClient = createStockClient(serviceRegistry);

        // ==================== SERVICES ====================
        // Initialize services with dependencies (DIP)
        this.materialService = new MaterialService(materialRepository);
        this.stockService = new StockService(stockRepository);
        this.authService = new AuthService(userRepository, authConfig);
        this.orderService = new OrderService(orderRepository);
        this.optimizationService = new OptimizationService(optimizationRepository, this.prisma);

        // ProductionService uses service clients instead of cross-module repositories
        this.productionService = new ProductionService(productionRepository, optimizationClient, stockClient);

        this.reportService = new ReportService(reportRepository);
        this.cuttingJobService = new CuttingJobService(cuttingJobRepository, this.prisma);
        this.importService = new ImportService(this.prisma);
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
    }

    /**
     * Initialize Express middleware
     */
    private initializeMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
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
        const exportController = new ExportController(this.prisma);
        const dashboardController = new DashboardController(this.prisma);

        // Create auth middleware with proper type
        const authMiddleware = createAuthMiddleware(this.authService as IAuthService);

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
    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }

    /**
     * Connect to database
     */
    private async connectDatabase(): Promise<void> {
        try {
            await this.prisma.$connect();
            console.log('✅ Database connected');
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
        this.initializeDependencies();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();

        // Initialize WebSocket
        websocketService.initialize(this.httpServer);

        this.httpServer.listen(this.port, () => {
            console.log(`🚀 Nestra server running on http://localhost:${this.port}`);
            console.log(`📚 Environment: ${process.env.NODE_ENV ?? 'development'}`);
            console.log('🔌 WebSocket available at /ws');
        });
    }

    /**
     * Graceful shutdown
     */
    public async shutdown(): Promise<void> {
        console.log('🛑 Shutting down...');
        await this.prisma.$disconnect();
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
