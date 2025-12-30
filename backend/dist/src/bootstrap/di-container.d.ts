/**
 * Dependency Injection Container
 * Following Dependency Inversion Principle (DIP)
 * Composition Root - all dependencies are wired up here
 */
import { Database } from '../db';
import { IAuthService } from '../core/interfaces';
import { MaterialService } from '../modules/material';
import { StockService } from '../modules/stock';
import { OrderService } from '../modules/order';
import { OptimizationService } from '../modules/optimization';
import { ProductionService } from '../modules/production';
import { ReportService } from '../modules/report';
import { CuttingJobService } from '../modules/cutting-job';
import { MachineService } from '../modules/machine';
import { CustomerService } from '../modules/customer';
import { ImportService } from '../modules/import';
import { LocationService } from '../modules/location';
import { TenantService } from '../modules/tenant';
import { RealtimeDashboardService } from '../modules/realtime-dashboard';
import { PresenceService, DocumentLockService, ActivityFeedService } from '../modules/collaboration';
import { AuditService } from '../modules/audit';
import { NotificationService } from '../modules/notification';
import { ForecastingService, AnomalyService, RecommendationService } from '../modules/analytics';
import { EnhancedPredictionService, ModelRegistryService, PredictionLoggerService } from '../modules/ml-analytics';
import { SupplierService } from '../modules/supplier';
import { RbacService } from '../modules/rbac';
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
    tenantService: TenantService;
    dashboardService: RealtimeDashboardService;
    presenceService: PresenceService;
    documentLockService: DocumentLockService;
    activityFeedService: ActivityFeedService;
    auditService: AuditService;
    notificationService: NotificationService;
    forecastingService: ForecastingService;
    anomalyService: AnomalyService;
    recommendationService: RecommendationService;
    mlPredictionService: EnhancedPredictionService;
    modelRegistryService: ModelRegistryService;
    predictionLoggerService: PredictionLoggerService;
    supplierService: SupplierService;
    rbacService: RbacService;
}
/**
 * Initialize all dependencies - Composition Root
 */
export declare function initializeDependencies(db: Database): IAppServices;
//# sourceMappingURL=di-container.d.ts.map