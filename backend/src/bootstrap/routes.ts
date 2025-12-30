/**
 * Express Routes Configuration
 * Following Single Responsibility Principle (SRP)
 * Responsible for route registration only
 */

import { Express } from 'express';
import { Database } from '../db';

// Controllers
import { MaterialController } from '../modules/material';
import { StockController } from '../modules/stock';
import { AuthController } from '../modules/auth';
import { OrderController } from '../modules/order';
import { OptimizationController } from '../modules/optimization';
import { ProductionController } from '../modules/production';
import { ReportController } from '../modules/report';
import { CuttingJobController } from '../modules/cutting-job';
import { ImportController } from '../modules/import';
import { MachineController } from '../modules/machine';
import { CustomerController } from '../modules/customer';
import { LocationController } from '../modules/location';
import { ExportRepository, ExportController } from '../modules/export';
import { DashboardRepository, DashboardService, DashboardController } from '../modules/dashboard';
import { createAuditRouter } from '../modules/audit';
import { getHealthController } from '../controllers/health.controller';
import { AnalyticsController } from '../modules/analytics';
import { MLAdminController, createMLAnalyticsController } from '../modules/ml-analytics';
import { SupplierController } from '../modules/supplier';
import { createPermissionMiddleware, PERMISSIONS } from '../modules/rbac';

// Middleware
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { authRateLimiter, optimizationRateLimiter, analyticsRateLimiter } from '../middleware/rate-limit.middleware';
import { optimizationTimeout } from '../middleware/timeout.middleware';
import { errorHandler } from '../middleware/errorHandler';
import { tenantMiddleware } from '../middleware/tenant.middleware';

// Interfaces
import { IAuthService } from '../core/interfaces';

// Services Container
import { IAppServices } from './di-container';

/**
 * Initialize all routes with dependency injection
 */
export function initializeRoutes(app: Express, services: IAppServices, db: Database): void {
    // Create controllers with injected services
    const materialController = new MaterialController(services.materialService);
    const stockController = new StockController(services.stockService);
    const authController = new AuthController(services.authService);
    const orderController = new OrderController(services.orderService);
    const optimizationController = new OptimizationController(services.optimizationService);
    const productionController = new ProductionController(services.productionService);
    const reportController = new ReportController(services.reportService);
    const cuttingJobController = new CuttingJobController(services.cuttingJobService);
    const importController = new ImportController(services.importService);
    const machineController = new MachineController(services.machineService);
    const customerController = new CustomerController(services.customerService);
    const locationController = new LocationController(services.locationService);

    // Export module with repository injection
    const exportRepository = new ExportRepository(db);
    const exportController = new ExportController(exportRepository);

    // Dashboard module with repository -> service -> controller injection
    const dashboardRepository = new DashboardRepository(db);
    const dashboardService = new DashboardService(dashboardRepository);
    const dashboardController = new DashboardController(dashboardService);

    // Create auth middleware with proper type
    const authMiddleware = createAuthMiddleware(services.authService as IAuthService);

    // Tenant context middleware (must be after auth)
    const tenantContext = tenantMiddleware();

    // Permission middleware (RBAC)
    const { requirePermission, requireAnyPermission, requireAdmin } =
        createPermissionMiddleware(services.rbacService);

    // Health check endpoints (public)
    const healthController = getHealthController();
    app.use(healthController.router);

    // Public routes (with stricter rate limiting)
    app.use('/api/auth', authRateLimiter, authController.router);

    // Protected routes (with tenant context)
    app.use('/api/materials', authMiddleware, tenantContext, materialController.router);
    app.use('/api/stock', authMiddleware, tenantContext, stockController.router);
    app.use('/api/orders', authMiddleware, tenantContext, orderController.router);
    app.use(
        '/api/optimization',
        authMiddleware,
        tenantContext,
        optimizationRateLimiter,
        optimizationTimeout,
        optimizationController.router
    );
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
    const auditRouter = createAuditRouter(services.auditService, authMiddleware);
    app.use('/api/audit', auditRouter);

    // Analytics Module (with tiered rate limiting)
    const analyticsController = new AnalyticsController(
        services.forecastingService,
        services.anomalyService,
        services.recommendationService
    );
    app.use('/api/analytics', authMiddleware, analyticsRateLimiter, requirePermission(PERMISSIONS.REPORTS_READ), analyticsController.router);

    // ML Admin Module (model registry, monitoring, drift detection) - Admin only
    const mlAdminController = new MLAdminController(db);
    app.use('/api/ml/admin', authMiddleware, requireAdmin(), mlAdminController.router);

    // ML Inference & Monitoring Endpoints (Authenticated)
    const mlAnalyticsController = createMLAnalyticsController(db);
    app.use('/api/ml', authMiddleware, mlAnalyticsController.router);

    // Supplier & Purchasing Module
    const supplierController = new SupplierController(services.supplierService);
    app.use('/api/suppliers', authMiddleware, tenantContext, requirePermission(PERMISSIONS.SUPPLIERS_READ), supplierController.router);
}

/**
 * Initialize error handling middleware
 * Must be called after all routes are registered
 */
export function initializeErrorHandling(app: Express): void {
    app.use(errorHandler);
}
