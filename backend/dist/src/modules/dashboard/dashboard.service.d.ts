/**
 * Dashboard Service
 * Provides analytics and KPIs for the dashboard
 * Refactored to use repository injection instead of direct Prisma
 */
import { IDashboardRepository, IOrderStats, IJobStats, IStockStats, IProductionStats } from './dashboard.repository';
export interface IDashboardStats {
    orders: IOrderStats;
    cuttingJobs: IJobStats;
    stock: IStockStats;
    production: IProductionStats;
}
export interface IRecentActivity {
    type: 'order' | 'cutting_job' | 'plan' | 'production';
    id: string;
    number: string;
    status: string;
    timestamp: Date;
}
export interface IWasteAnalytics {
    period: string;
    totalWaste: number;
    wastePercentage: number;
    planCount: number;
}
export interface IMaterialUsage {
    materialType: string;
    usageCount: number;
    wastePercentage: number;
}
export interface IDashboardService {
    getStats(): Promise<IDashboardStats>;
    getRecentActivity(limit?: number): Promise<IRecentActivity[]>;
    getWasteAnalytics(days?: number): Promise<IWasteAnalytics[]>;
    getMaterialUsage(): Promise<IMaterialUsage[]>;
}
export declare class DashboardService implements IDashboardService {
    private readonly repository;
    constructor(repository: IDashboardRepository);
    getStats(): Promise<IDashboardStats>;
    getRecentActivity(limit?: number): Promise<IRecentActivity[]>;
    getWasteAnalytics(days?: number): Promise<IWasteAnalytics[]>;
    private getWeekStart;
    getMaterialUsage(): Promise<IMaterialUsage[]>;
}
//# sourceMappingURL=dashboard.service.d.ts.map