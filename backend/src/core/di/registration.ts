/**
 * DI Registration Module
 * Wires all dependencies into the container
 * This is the Composition Root
 */

import { container, TOKENS, DIContainer } from './container';
import { Database } from '../../db';
import { getConfig } from '../config';

// ==================== REPOSITORY IMPORTS ====================
import { MaterialRepository } from '../../modules/material';
import { StockRepository } from '../../modules/stock';
import { OrderRepository } from '../../modules/order';
import { OptimizationRepository } from '../../modules/optimization';
import { ProductionRepository } from '../../modules/production';
import { ReportRepository } from '../../modules/report';
import { CuttingJobRepository } from '../../modules/cutting-job';
import { MachineRepository } from '../../modules/machine';
import { CustomerRepository } from '../../modules/customer';
import { LocationRepository } from '../../modules/location';
import { ImportRepository } from '../../modules/import';
import { TenantRepository } from '../../modules/tenant';
import { RealtimeDashboardRepository } from '../../modules/realtime-dashboard';
import { CollaborationRepository } from '../../modules/collaboration';
import { AuditRepository } from '../../modules/audit';
import { UserRepository } from '../../modules/auth';

// ==================== SERVICE IMPORTS ====================
import { MaterialService } from '../../modules/material';
import { StockService } from '../../modules/stock';
import { AuthService, IAuthConfig } from '../../modules/auth';
import { OrderService } from '../../modules/order';
import { OptimizationService } from '../../modules/optimization';
import { ProductionService } from '../../modules/production';
import { ReportService } from '../../modules/report';
import { CuttingJobService } from '../../modules/cutting-job';
import { ImportService } from '../../modules/import';
import { MachineService } from '../../modules/machine';
import { CustomerService } from '../../modules/customer';
import { LocationService } from '../../modules/location';
import { TenantService } from '../../modules/tenant';
import { RealtimeDashboardService } from '../../modules/realtime-dashboard';
import { PresenceService, DocumentLockService, ActivityFeedService } from '../../modules/collaboration';
import { AuditService, initializeAuditService } from '../../modules/audit';
import { NotificationService } from '../../modules/notification';

// ==================== SERVICE HANDLERS ====================
import {
    ServiceRegistry,
    createOptimizationClient,
    createStockClient,
    createCuttingJobClient,
    createStockQueryClient
} from '../services';
import { OptimizationServiceHandler } from '../../modules/optimization';
import { StockServiceHandler } from '../../modules/stock';
import { OrderServiceHandler } from '../../modules/order';
import { MaterialServiceHandler } from '../../modules/material';
import { MachineServiceHandler } from '../../modules/machine';
import { CustomerServiceHandler } from '../../modules/customer';
import { CuttingJobServiceHandler } from '../../modules/cutting-job';
import { AuthServiceHandler } from '../../modules/auth';
import { LocationServiceHandler } from '../../modules/location';

/**
 * Register all repositories
 */
function registerRepositories(c: DIContainer, db: Database): void {
    c.instance(TOKENS.Database, db);

    c.bindFactoryWithDeps(TOKENS.MaterialRepository, () => new MaterialRepository(db));
    c.bindFactoryWithDeps(TOKENS.StockRepository, () => new StockRepository(db));
    c.bindFactoryWithDeps(TOKENS.UserRepository, () => new UserRepository(db));
    c.bindFactoryWithDeps(TOKENS.OrderRepository, () => new OrderRepository(db));
    c.bindFactoryWithDeps(TOKENS.OptimizationRepository, () => new OptimizationRepository(db));
    c.bindFactoryWithDeps(TOKENS.ProductionRepository, () => new ProductionRepository(db));
    c.bindFactoryWithDeps(TOKENS.ReportRepository, () => new ReportRepository(db));
    c.bindFactoryWithDeps(TOKENS.CuttingJobRepository, () => new CuttingJobRepository(db));
    c.bindFactoryWithDeps(TOKENS.MachineRepository, () => new MachineRepository(db));
    c.bindFactoryWithDeps(TOKENS.CustomerRepository, () => new CustomerRepository(db));
    c.bindFactoryWithDeps(TOKENS.LocationRepository, () => new LocationRepository(db));
    c.bindFactoryWithDeps(TOKENS.ImportRepository, () => new ImportRepository(db));
    c.bindFactoryWithDeps(TOKENS.TenantRepository, () => new TenantRepository(db));
    c.bindFactoryWithDeps(TOKENS.DashboardRepository, () => new RealtimeDashboardRepository(db));
    c.bindFactoryWithDeps(TOKENS.CollaborationRepository, () => new CollaborationRepository(db));
    c.bindFactoryWithDeps(TOKENS.AuditRepository, () => new AuditRepository(db));
}

/**
 * Register service handlers and create service registry
 */
function registerServiceHandlers(c: DIContainer): ServiceRegistry {
    const serviceRegistry = ServiceRegistry.getInstance();

    serviceRegistry.register('optimization', new OptimizationServiceHandler(c.resolve(TOKENS.OptimizationRepository)));
    serviceRegistry.register('stock', new StockServiceHandler(c.resolve(TOKENS.StockRepository)));
    serviceRegistry.register('order', new OrderServiceHandler(c.resolve(TOKENS.OrderRepository)));
    serviceRegistry.register('material', new MaterialServiceHandler(c.resolve(TOKENS.MaterialRepository)));
    serviceRegistry.register('machine', new MachineServiceHandler(c.resolve(TOKENS.MachineRepository)));
    serviceRegistry.register('customer', new CustomerServiceHandler(c.resolve(TOKENS.CustomerRepository)));
    serviceRegistry.register('cutting-job', new CuttingJobServiceHandler(c.resolve(TOKENS.CuttingJobRepository)));
    serviceRegistry.register('auth', new AuthServiceHandler(c.resolve(TOKENS.UserRepository)));
    serviceRegistry.register('location', new LocationServiceHandler(c.resolve(TOKENS.LocationRepository)));

    c.instance(TOKENS.ServiceRegistry, serviceRegistry);

    // Register service clients
    c.bindFactoryWithDeps(TOKENS.OptimizationClient, () => createOptimizationClient(serviceRegistry));
    c.bindFactoryWithDeps(TOKENS.StockClient, () => createStockClient(serviceRegistry));
    c.bindFactoryWithDeps(TOKENS.CuttingJobClient, () => createCuttingJobClient(serviceRegistry));
    c.bindFactoryWithDeps(TOKENS.StockQueryClient, () => createStockQueryClient(serviceRegistry));

    return serviceRegistry;
}

/**
 * Register all services
 */
function registerServices(c: DIContainer): void {
    const config = getConfig();
    const authConfig: IAuthConfig = {
        jwtSecret: config.jwt.secret,
        jwtExpiresIn: config.jwt.expiresIn,
        saltRounds: 10
    };
    c.instance(TOKENS.AuthConfig, authConfig);

    // Core services
    c.bindFactoryWithDeps(TOKENS.MaterialService, (di) =>
        new MaterialService(di.resolve(TOKENS.MaterialRepository))
    );
    c.bindFactoryWithDeps(TOKENS.StockService, (di) =>
        new StockService(di.resolve(TOKENS.StockRepository))
    );
    c.bindFactoryWithDeps(TOKENS.AuthService, (di) =>
        new AuthService(di.resolve(TOKENS.UserRepository), di.resolve(TOKENS.AuthConfig))
    );
    c.bindFactoryWithDeps(TOKENS.OrderService, (di) =>
        new OrderService(di.resolve(TOKENS.OrderRepository))
    );
    c.bindFactoryWithDeps(TOKENS.OptimizationService, (di) =>
        new OptimizationService(
            di.resolve(TOKENS.OptimizationRepository),
            di.resolve(TOKENS.CuttingJobClient),
            di.resolve(TOKENS.StockQueryClient)
        )
    );
    c.bindFactoryWithDeps(TOKENS.ProductionService, (di) =>
        new ProductionService(
            di.resolve(TOKENS.ProductionRepository),
            di.resolve(TOKENS.OptimizationClient),
            di.resolve(TOKENS.StockClient)
        )
    );
    c.bindFactoryWithDeps(TOKENS.ReportService, (di) =>
        new ReportService(di.resolve(TOKENS.ReportRepository))
    );
    c.bindFactoryWithDeps(TOKENS.CuttingJobService, (di) =>
        new CuttingJobService(di.resolve(TOKENS.CuttingJobRepository))
    );
    c.bindFactoryWithDeps(TOKENS.ImportService, (di) =>
        new ImportService(di.resolve(TOKENS.ImportRepository))
    );
    c.bindFactoryWithDeps(TOKENS.MachineService, (di) =>
        new MachineService(di.resolve(TOKENS.MachineRepository))
    );
    c.bindFactoryWithDeps(TOKENS.CustomerService, (di) =>
        new CustomerService(di.resolve(TOKENS.CustomerRepository))
    );
    c.bindFactoryWithDeps(TOKENS.LocationService, (di) =>
        new LocationService(di.resolve(TOKENS.LocationRepository))
    );

    // Multi-tenant & Collaboration
    c.bindFactoryWithDeps(TOKENS.TenantService, (di) =>
        new TenantService(di.resolve(TOKENS.TenantRepository))
    );
    c.bindFactoryWithDeps(TOKENS.DashboardService, (di) =>
        new RealtimeDashboardService(di.resolve(TOKENS.DashboardRepository))
    );
    c.bindFactoryWithDeps(TOKENS.PresenceService, () => new PresenceService());
    c.bindFactoryWithDeps(TOKENS.DocumentLockService, (di) =>
        new DocumentLockService(di.resolve(TOKENS.CollaborationRepository))
    );
    c.bindFactoryWithDeps(TOKENS.ActivityFeedService, (di) =>
        new ActivityFeedService(di.resolve(TOKENS.CollaborationRepository))
    );

    // Advanced Features
    c.bindFactoryWithDeps(TOKENS.AuditService, (di) => {
        const auditService = new AuditService(di.resolve(TOKENS.AuditRepository));
        initializeAuditService(auditService);
        return auditService;
    });
    c.bindFactoryWithDeps(TOKENS.NotificationService, () => new NotificationService());
}

/**
 * Initialize DI container with all dependencies
 * This is the new Composition Root
 */
export function initializeContainer(db: Database): DIContainer {
    // Clear any existing bindings
    container.clear();

    // Register in order of dependencies
    registerRepositories(container, db);
    registerServiceHandlers(container);
    registerServices(container);

    return container;
}

/**
 * Get IAppServices interface for backward compatibility
 */
export interface IAppServices {
    materialService: MaterialService;
    stockService: StockService;
    authService: AuthService;
    orderService: OrderService;
    optimizationService: OptimizationService;
    productionService: ProductionService;
    reportService: ReportService;
    cuttingJobService: CuttingJobService;
    importService: ImportService;
    machineService: MachineService;
    customerService: CustomerService;
    locationService: LocationService;
    tenantService: TenantService;
    dashboardService: RealtimeDashboardService;
    presenceService: PresenceService;
    documentLockService: DocumentLockService;
    activityFeedService: ActivityFeedService;
    auditService: AuditService;
    notificationService: NotificationService;
}

/**
 * Get services object for backward compatibility
 */
export function getServices(c: DIContainer = container): IAppServices {
    return {
        materialService: c.resolve(TOKENS.MaterialService),
        stockService: c.resolve(TOKENS.StockService),
        authService: c.resolve(TOKENS.AuthService),
        orderService: c.resolve(TOKENS.OrderService),
        optimizationService: c.resolve(TOKENS.OptimizationService),
        productionService: c.resolve(TOKENS.ProductionService),
        reportService: c.resolve(TOKENS.ReportService),
        cuttingJobService: c.resolve(TOKENS.CuttingJobService),
        importService: c.resolve(TOKENS.ImportService),
        machineService: c.resolve(TOKENS.MachineService),
        customerService: c.resolve(TOKENS.CustomerService),
        locationService: c.resolve(TOKENS.LocationService),
        tenantService: c.resolve(TOKENS.TenantService),
        dashboardService: c.resolve(TOKENS.DashboardService),
        presenceService: c.resolve(TOKENS.PresenceService),
        documentLockService: c.resolve(TOKENS.DocumentLockService),
        activityFeedService: c.resolve(TOKENS.ActivityFeedService),
        auditService: c.resolve(TOKENS.AuditService),
        notificationService: c.resolve(TOKENS.NotificationService)
    };
}
