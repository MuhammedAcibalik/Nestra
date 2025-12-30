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
const analytics_1 = require("../modules/analytics");
const ml_analytics_1 = require("../modules/ml-analytics");
const supplier_1 = require("../modules/supplier");
const rbac_1 = require("../modules/rbac");
// Middleware
const authMiddleware_1 = require("../middleware/authMiddleware");
const rate_limit_middleware_1 = require("../middleware/rate-limit.middleware");
const timeout_middleware_1 = require("../middleware/timeout.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
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
    // Tenant context middleware (must be after auth)
    const tenantContext = (0, tenant_middleware_1.tenantMiddleware)();
    // Permission middleware (RBAC)
    const { requirePermission, requireAnyPermission, requireAdmin } = (0, rbac_1.createPermissionMiddleware)(services.rbacService);
    // Health check endpoints (public)
    const healthController = (0, health_controller_1.getHealthController)();
    app.use(healthController.router);
    // Public routes (with stricter rate limiting)
    app.use('/api/auth', rate_limit_middleware_1.authRateLimiter, authController.router);
    // Protected routes (with tenant context)
    app.use('/api/materials', authMiddleware, tenantContext, materialController.router);
    app.use('/api/stock', authMiddleware, tenantContext, stockController.router);
    app.use('/api/orders', authMiddleware, tenantContext, orderController.router);
    app.use('/api/optimization', authMiddleware, tenantContext, rate_limit_middleware_1.optimizationRateLimiter, timeout_middleware_1.optimizationTimeout, optimizationController.router);
    app.use('/api/production', authMiddleware, tenantContext, productionController.router);
    app.use('/api/reports', authMiddleware, tenantContext, reportController.router);
    app.use('/api/cutting-jobs', authMiddleware, tenantContext, cuttingJobController.router);
    app.use('/api/import', authMiddleware, tenantContext, importController.router);
    app.use('/api/machines', authMiddleware, tenantContext, machineController.router);
    app.use('/api/customers', authMiddleware, tenantContext, customerController.router);
    app.use('/api/locations', authMiddleware, tenantContext, locationController.router);
    app.use('/api/export', authMiddleware, tenantContext, exportController.router);
    app.use('/api/dashboard', authMiddleware, tenantContext, dashboardController.router);
    // Advanced Features
    const auditRouter = (0, audit_1.createAuditRouter)(services.auditService, authMiddleware);
    app.use('/api/audit', auditRouter);
    // Analytics Module (with tiered rate limiting)
    const analyticsController = new analytics_1.AnalyticsController(services.forecastingService, services.anomalyService, services.recommendationService);
    app.use('/api/analytics', authMiddleware, rate_limit_middleware_1.analyticsRateLimiter, requirePermission(rbac_1.PERMISSIONS.REPORTS_READ), analyticsController.router);
    // ML Admin Module (model registry, monitoring, drift detection) - Admin only
    const mlAdminController = new ml_analytics_1.MLAdminController(db);
    app.use('/api/ml/admin', authMiddleware, requireAdmin(), mlAdminController.router);
    // ML Inference & Monitoring Endpoints (Authenticated)
    const mlAnalyticsController = (0, ml_analytics_1.createMLAnalyticsController)(db);
    app.use('/api/ml', authMiddleware, mlAnalyticsController.router);
    // Supplier & Purchasing Module
    const supplierController = new supplier_1.SupplierController(services.supplierService);
    app.use('/api/suppliers', authMiddleware, tenantContext, requirePermission(rbac_1.PERMISSIONS.SUPPLIERS_READ), supplierController.router);
}
/**
 * Initialize error handling middleware
 * Must be called after all routes are registered
 */
function initializeErrorHandling(app) {
    app.use(errorHandler_1.errorHandler);
}
//# sourceMappingURL=routes.js.map