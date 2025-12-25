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

// Middleware
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { authRateLimiter, optimizationRateLimiter } from '../middleware/rate-limit.middleware';
import { optimizationTimeout } from '../middleware/timeout.middleware';
import { errorHandler } from '../middleware/errorHandler';

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

    // Health check endpoints (public)
    const healthController = getHealthController();
    app.use(healthController.router);

    // Public routes (with stricter rate limiting)
    app.use('/api/auth', authRateLimiter, authController.router);

    // Protected routes
    app.use('/api/materials', authMiddleware, materialController.router);
    app.use('/api/stock', authMiddleware, stockController.router);
    app.use('/api/orders', authMiddleware, orderController.router);
    app.use(
        '/api/optimization',
        authMiddleware,
        optimizationRateLimiter,
        optimizationTimeout,
        optimizationController.router
    );
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
    const auditRouter = createAuditRouter(services.auditService, authMiddleware);
    app.use('/api/audit', auditRouter);
}

/**
 * Initialize error handling middleware
 * Must be called after all routes are registered
 */
export function initializeErrorHandling(app: Express): void {
    app.use(errorHandler);
}
