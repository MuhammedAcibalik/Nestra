/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Composition Root - all dependencies are wired up here
 */

import { Database } from '../db';
import { getConfig } from '../core/config';
import { IAuthService } from '../core/interfaces';
import { createModuleLogger } from '../core/logger';

const logger = createModuleLogger('DIContainer');

// Core Services
import {
    ServiceRegistry,
    createOptimizationClient,
    createStockClient,
    createCuttingJobClient,
    createStockQueryClient
} from '../core/services';

// Material Module
import { MaterialRepository, MaterialService, MaterialServiceHandler, MaterialEventHandler } from '../modules/material';

// Stock Module
import { StockRepository, StockService, StockServiceHandler, StockEventHandler } from '../modules/stock';

// Auth Module
import { UserRepository, AuthService, AuthServiceHandler, IAuthConfig } from '../modules/auth';

// Order Module
import { OrderRepository, OrderService, OrderServiceHandler, OrderEventHandler } from '../modules/order';

// Optimization Module
import {
    OptimizationRepository,
    OptimizationService,
    OptimizationServiceHandler,
    OptimizationEventHandler
} from '../modules/optimization';
import { OptimizationConsumer } from '../modules/optimization/optimization.consumer';

// Production Module
import { ProductionRepository, ProductionService, ProductionEventHandler } from '../modules/production';

// Report Module
import { ReportRepository, ReportService } from '../modules/report';

// CuttingJob Module
import {
    CuttingJobRepository,
    CuttingJobService,
    CuttingJobServiceHandler,
    CuttingJobEventHandler
} from '../modules/cutting-job';

// Machine Module
import { MachineRepository, MachineService, MachineServiceHandler, MachineEventHandler } from '../modules/machine';

// Customer Module
import { CustomerRepository, CustomerService, CustomerServiceHandler } from '../modules/customer';

// Import Module
import { ImportRepository, ImportService } from '../modules/import';

// Location Module
import { LocationRepository, LocationService, LocationServiceHandler } from '../modules/location';

// Tenant Module
import { TenantRepository, TenantService } from '../modules/tenant';

// Realtime Dashboard Module
import { RealtimeDashboardRepository, RealtimeDashboardService } from '../modules/realtime-dashboard';

// Collaboration Module
import {
    CollaborationRepository,
    PresenceService,
    DocumentLockService,
    ActivityFeedService
} from '../modules/collaboration';

// Audit Module
import { AuditRepository, AuditService, initializeAuditService } from '../modules/audit';

// Notification Module
import { NotificationService } from '../modules/notification';

/**
 * Application Services Container
 */
export interface IAppServices {
    materialService: MaterialService;
    stockService: StockService;
    authService: IAuthService;
    orderService: OrderService;
    optimizationService: OptimizationService;
    productionService: ProductionService;
    reportService: ReportService;
    cuttingJobService: CuttingJobService;
    importService: ImportService;
    machineService: MachineService;
    customerService: CustomerService;
    locationService: LocationService;
    // Multi-tenant & Collaboration services
    tenantService: TenantService;
    dashboardService: RealtimeDashboardService;
    presenceService: PresenceService;
    documentLockService: DocumentLockService;
    activityFeedService: ActivityFeedService;
    // Advanced Features
    auditService: AuditService;
    notificationService: NotificationService;
}

/**
 * Initialize all dependencies - Composition Root
 */
export function initializeDependencies(db: Database): IAppServices {
    // Auth configuration - uses centralized config (JWT_SECRET required)
    const config = getConfig();
    const authConfig: IAuthConfig = {
        jwtSecret: config.jwt.secret,
        jwtExpiresIn: config.jwt.expiresIn,
        saltRounds: 10
    };

    // Initialize repositories
    const materialRepository = new MaterialRepository(db);
    const stockRepository = new StockRepository(db);
    const userRepository = new UserRepository(db);
    const orderRepository = new OrderRepository(db);
    const optimizationRepository = new OptimizationRepository(db);
    const productionRepository = new ProductionRepository(db);
    const reportRepository = new ReportRepository(db);
    const cuttingJobRepository = new CuttingJobRepository(db);
    const machineRepository = new MachineRepository(db);
    const customerRepository = new CustomerRepository(db);
    const locationRepository = new LocationRepository(db);
    const importRepository = new ImportRepository(db);
    const tenantRepository = new TenantRepository(db);
    const dashboardRepository = new RealtimeDashboardRepository(db);
    const collaborationRepository = new CollaborationRepository(db);
    const auditRepository = new AuditRepository(db);

    // ==================== MICROSERVICE INFRASTRUCTURE ====================
    const serviceRegistry = ServiceRegistry.getInstance();

    // Register service handlers
    serviceRegistry.register('optimization', new OptimizationServiceHandler(optimizationRepository));
    serviceRegistry.register('stock', new StockServiceHandler(stockRepository));
    serviceRegistry.register('order', new OrderServiceHandler(orderRepository));
    serviceRegistry.register('material', new MaterialServiceHandler(materialRepository));
    serviceRegistry.register('machine', new MachineServiceHandler(machineRepository));
    serviceRegistry.register('customer', new CustomerServiceHandler(customerRepository));
    serviceRegistry.register('cutting-job', new CuttingJobServiceHandler(cuttingJobRepository));
    serviceRegistry.register('auth', new AuthServiceHandler(userRepository));
    serviceRegistry.register('location', new LocationServiceHandler(locationRepository));

    // Create service clients for cross-module access
    const optimizationClient = createOptimizationClient(serviceRegistry);
    const stockClient = createStockClient(serviceRegistry);
    const cuttingJobClient = createCuttingJobClient(serviceRegistry);
    const stockQueryClient = createStockQueryClient(serviceRegistry);

    // ==================== SERVICES ====================
    const services: IAppServices = {
        materialService: new MaterialService(materialRepository),
        stockService: new StockService(stockRepository),
        authService: new AuthService(userRepository, authConfig),
        orderService: new OrderService(orderRepository),
        optimizationService: new OptimizationService(optimizationRepository, cuttingJobClient, stockQueryClient),
        productionService: new ProductionService(productionRepository, optimizationClient, stockClient),
        reportService: new ReportService(reportRepository),
        cuttingJobService: new CuttingJobService(cuttingJobRepository),
        importService: new ImportService(importRepository),
        machineService: new MachineService(machineRepository),
        customerService: new CustomerService(customerRepository),
        locationService: new LocationService(locationRepository),
        // Multi-tenant & Collaboration services
        tenantService: new TenantService(tenantRepository),
        dashboardService: new RealtimeDashboardService(dashboardRepository),
        presenceService: new PresenceService(),
        documentLockService: new DocumentLockService(collaborationRepository),
        activityFeedService: new ActivityFeedService(collaborationRepository),
        // Advanced Features
        auditService: new AuditService(auditRepository),
        notificationService: new NotificationService()
    };

    // Initialize global audit service accessor
    initializeAuditService(services.auditService);

    // ==================== EVENT HANDLERS ====================
    // Store references for lifecycle management
    const eventHandlers = [
        new StockEventHandler(stockRepository),
        new OptimizationEventHandler(optimizationRepository),
        new OrderEventHandler(orderRepository),
        new ProductionEventHandler(productionRepository),
        new MaterialEventHandler(materialRepository),
        new MachineEventHandler(machineRepository),
        new CuttingJobEventHandler(cuttingJobRepository)
    ];
    eventHandlers.forEach((handler) => handler.register());
    logger.info('Event handlers registered', { count: eventHandlers.length });

    // ==================== RABBITMQ CONSUMERS ====================
    const engine = services.optimizationService.getEngine();
    if (engine) {
        new OptimizationConsumer(engine).register();
    } else {
        logger.warn('Optimization engine not available, consumer not registered');
    }

    return services;
}
