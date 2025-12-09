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
// Middleware
const errorHandler_1 = require("./middleware/errorHandler");
const authMiddleware_1 = require("./middleware/authMiddleware");
dotenv_1.default.config();
/**
 * Application class - Single Responsibility: Application lifecycle management
 */
class Application {
    app;
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
    constructor() {
        this.app = (0, express_1.default)();
        this.prisma = new client_1.PrismaClient();
        this.port = parseInt(process.env.PORT ?? '3000', 10);
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
        // Initialize strategy registry
        // Initialize services with dependencies (DIP)
        this.materialService = new material_1.MaterialService(materialRepository);
        this.stockService = new stock_1.StockService(stockRepository);
        this.authService = new auth_1.AuthService(userRepository, authConfig);
        this.orderService = new order_1.OrderService(orderRepository);
        this.optimizationService = new optimization_1.OptimizationService(optimizationRepository);
        this.productionService = new production_1.ProductionService(productionRepository, optimizationRepository, stockRepository);
        this.reportService = new report_1.ReportService(reportRepository);
        this.cuttingJobService = new cutting_job_1.CuttingJobService(cuttingJobRepository, this.prisma);
        this.importService = new import_1.ImportService(this.prisma);
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
        this.app.listen(this.port, () => {
            console.log(`🚀 Nestra server running on http://localhost:${this.port}`);
            console.log(`📚 Environment: ${process.env.NODE_ENV ?? 'development'}`);
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
// Application entry point
const app = new Application();
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
});
process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
});
// Start application
app.start().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map