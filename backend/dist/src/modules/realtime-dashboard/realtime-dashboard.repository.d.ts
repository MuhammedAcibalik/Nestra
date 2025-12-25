/**
 * Real-time Dashboard Repository
 * Data access for dashboard metrics and real-time data
 * Following Repository Pattern with Drizzle ORM
 */
import { Database } from '../../db';
export interface IDashboardRepository {
    getActiveProductionCount(tenantId: string): Promise<number>;
    getPendingOptimizationCount(tenantId: string): Promise<number>;
    getPendingOrderCount(tenantId: string): Promise<number>;
    getLowStockCount(tenantId: string): Promise<number>;
    getTodayWastePercentage(tenantId: string): Promise<number>;
    getTodayCompletedPlanCount(tenantId: string): Promise<number>;
    getActiveProductions(tenantId: string, limit?: number): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockItems(tenantId: string, limit?: number): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;
    getOrderStats(tenantId: string): Promise<IOrderStats>;
    getProductionStats(tenantId: string): Promise<IProductionStats>;
}
export interface IActiveProduction {
    readonly id: string;
    readonly planNumber: string;
    readonly status: string;
    readonly progress: number;
    readonly operatorId: string;
    readonly startedAt: Date;
}
export interface IRunningOptimization {
    readonly id: string;
    readonly name: string;
    readonly status: string;
    readonly createdAt: Date;
}
export interface ILowStockItem {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly quantity: number;
    readonly alertLevel: 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK';
}
export interface IRecentActivity {
    readonly id: string;
    readonly activityType: string;
    readonly actorId: string;
    readonly targetType: string | null;
    readonly targetId: string | null;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
}
export interface IOrderStats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
}
export interface IProductionStats {
    active: number;
    completed: number;
    paused: number;
}
export declare class RealtimeDashboardRepository implements IDashboardRepository {
    private readonly db;
    constructor(db: Database);
    getActiveProductionCount(tenantId: string): Promise<number>;
    getPendingOptimizationCount(tenantId: string): Promise<number>;
    getPendingOrderCount(tenantId: string): Promise<number>;
    getLowStockCount(tenantId: string): Promise<number>;
    getTodayWastePercentage(tenantId: string): Promise<number>;
    getTodayCompletedPlanCount(tenantId: string): Promise<number>;
    getActiveProductions(tenantId: string, limit?: number): Promise<IActiveProduction[]>;
    getRunningOptimizations(tenantId: string): Promise<IRunningOptimization[]>;
    getLowStockItems(tenantId: string, limit?: number): Promise<ILowStockItem[]>;
    getRecentActivities(tenantId: string, limit?: number): Promise<IRecentActivity[]>;
    getOrderStats(tenantId: string): Promise<IOrderStats>;
    getProductionStats(tenantId: string): Promise<IProductionStats>;
    private calculateProgress;
    private getAlertLevel;
}
//# sourceMappingURL=realtime-dashboard.repository.d.ts.map