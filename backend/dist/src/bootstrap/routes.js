"use strict";
/**
 * Express Routes Configuration
 * Following Single Responsibility Principle (SRP)
 * Responsible for route registration only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeRoutes = initializeRoutes;
exports.initializeErrorHandling = initializeErrorHandling;
// Controllers
const material_1 = require("../modules/material");
const stock_1 = require("../modules/stock");
const auth_1 = require("../modules/auth");
const order_1 = require("../modules/order");
const optimization_1 = require("../modules/optimization");
const production_1 = require("../modules/production");
const report_1 = require("../modules/report");
const cutting_job_1 = require("../modules/cutting-job");
const import_1 = require("../modules/import");
const machine_1 = require("../modules/machine");
const customer_1 = require("../modules/customer");
const location_1 = require("../modules/location");
const export_1 = require("../modules/export");
const dashboard_1 = require("../modules/dashboard");
const audit_1 = require("../modules/audit");
const health_controller_1 = require("../controllers/health.controller");
// Middleware
const authMiddleware_1 = require("../middleware/authMiddleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const timeout_middleware_1 = require("../middleware/timeout.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Initialize all routes with dependency injection
 */
function initializeRoutes(app, services, db) {
    // Create controllers with injected services
    const materialController = new material_1.MaterialController(services.materialService);
    const stockController = new stock_1.StockController(services.stockService);
    const authController = new auth_1.AuthController(services.authService);
    const orderController = new order_1.OrderController(services.orderService);
    const optimizationController = new optimization_1.OptimizationController(services.optimizationService);
    const productionController = new production_1.ProductionController(services.productionService);
    const reportController = new report_1.ReportController(services.reportService);
    const cuttingJobController = new cutting_job_1.CuttingJobController(services.cuttingJobService);
    const importController = new import_1.ImportController(services.importService);
    const machineController = new machine_1.MachineController(services.machineService);
    const customerController = new customer_1.CustomerController(services.customerService);
    const locationController = new location_1.LocationController(services.locationService);
    // Export module with repository injection
    const exportRepository = new export_1.ExportRepository(db);
    const exportController = new export_1.ExportController(exportRepository);
    // Dashboard module with repository -> service -> controller injection
    const dashboardRepository = new dashboard_1.DashboardRepository(db);
    const dashboardService = new dashboard_1.DashboardService(dashboardRepository);
    const dashboardController = new dashboard_1.DashboardController(dashboardService);
    // Create auth middleware with proper type
    const authMiddleware = (0, authMiddleware_1.createAuthMiddleware)(services.authService);
    // Health check endpoints (public)
    const healthController = (0, health_controller_1.getHealthController)();
    app.use(healthController.router);
    // Public routes (with stricter rate limiting)
    app.use('/api/auth', rate_limit_middleware_1.authRateLimiter, authController.router);
    // Protected routes
    app.use('/api/materials', authMiddleware, materialController.router);
    app.use('/api/stock', authMiddleware, stockController.router);
    app.use('/api/orders', authMiddleware, orderController.router);
    app.use('/api/optimization', authMiddleware, rate_limit_middleware_1.optimizationRateLimiter, timeout_middleware_1.optimizationTimeout, optimizationController.router);
    app.use('/api/production', authMiddleware, productionController.router);
    app.use('/api/reports', authMiddleware, reportController.router);
    app.use('/api/cutting-jobs', authMiddleware, cuttingJobController.router);
    app.use('/api/import', authMiddleware, importController.router);
    app.use('/api/machines', authMiddleware, machineController.router);
    app.use('/api/customers', authMiddleware, customerController.router);
    app.use('/api/locations', authMiddleware, locationController.router);
    app.use('/api/export', authMiddleware, exportController.router);
    app.use('/api/dashboard', authMiddleware, dashboardController.router);
    // Advanced Features
    const auditRouter = (0, audit_1.createAuditRouter)(services.auditService, authMiddleware);
    app.use('/api/audit', auditRouter);
}
/**
 * Initialize error handling middleware
 * Must be called after all routes are registered
 */
function initializeErrorHandling(app) {
    app.use(errorHandler_1.errorHandler);
}
//# sourceMappingURL=routes.js.map