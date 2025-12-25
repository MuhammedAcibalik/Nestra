/**
 * Real-time Dashboard Service
 * Business logic for dashboard data aggregation and streaming
 * Following Single Responsibility Principle (SRP)
 */
import { IDashboardRepository, IActiveProduction, IRunningOptimization, ILowStockItem, IRecentActivity, IOrderStats, IProductionStats } from './realtime-dashboard.repository';
import { IProductionUpdatePayload, IOptimizationUpdatePayload, IStockAlertPayload, IActivityPayload } from './realtime-dashboard.events';
export interface IRealtimeDashboardService {
    getKPIs(tenantId: string): Promise<IDashboardKPIs>;
    getStats(tenantId: string): Promise<IDashboardStats>;
    getActiveProductions(tenantId: string): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockAlerts(tenantId: string): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;
    broadcastKPIUpdate(tenantId: string): Promise<void>;
    broadcastStatsUpdate(tenantId: string): Promise<void>;
    broadcastProductionUpdate(payload: IProductionUpdatePayload): void;
    broadcastOptimizationUpdate(payload: IOptimizationUpdatePayload): void;
    broadcastStockAlert(payload: IStockAlertPayload): void;
    broadcastActivity(payload: IActivityPayload): void;
    startKPIPolling(tenantId: string, intervalMs?: number): void;
    stopKPIPolling(tenantId: string): void;
}
export interface IDashboardKPIs {
    readonly activeProductions: number;
    readonly pendingOptimizations: number;
    readonly pendingOrders: number;
    readonly lowStockAlerts: number;
    readonly todayWastePercentage: number;
    readonly todayCompletedPlans: number;
}
export interface IDashboardStats {
    readonly orders: IOrderStats;
    readonly production: IProductionStats;
}
export declare class RealtimeDashboardService implements IRealtimeDashboardService {
    private readonly repository;
    private readonly eventBus;
    private readonly pollingIntervals;
    constructor(repository: IDashboardRepository);
    getKPIs(tenantId: string): Promise<IDashboardKPIs>;
    getStats(tenantId: string): Promise<IDashboardStats>;
    getActiveProductions(tenantId: string): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockAlerts(tenantId: string): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;
    broadcastKPIUpdate(tenantId: string): Promise<void>;
    broadcastStatsUpdate(tenantId: string): Promise<void>;
    broadcastProductionUpdate(payload: IProductionUpdatePayload): void;
    broadcastOptimizationUpdate(payload: IOptimizationUpdatePayload): void;
    broadcastStockAlert(payload: IStockAlertPayload): void;
    broadcastActivity(payload: IActivityPayload): void;
    startKPIPolling(tenantId: string, intervalMs?: number): void;
    stopKPIPolling(tenantId: string): void;
    private setupEventListeners;
    destroy(): void;
}
//# sourceMappingURL=realtime-dashboard.service.d.ts.map