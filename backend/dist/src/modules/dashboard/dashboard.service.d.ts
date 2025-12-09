/**
 * Dashboard Service
 * Provides analytics and KPIs for the dashboard
 */
import { PrismaClient } from '@prisma/client';
export interface IDashboardStats {
    orders: {
        total: number;
        pending: number;
        inProduction: number;
        completed: number;
    };
    cuttingJobs: {
        total: number;
        pending: number;
        optimizing: number;
        inProduction: number;
    };
    stock: {
        totalItems: number;
        lowStockCount: number;
        totalValue: number;
    };
    production: {
        activePlans: number;
        completedToday: number;
        averageWastePercentage: number;
    };
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
export interface IDashboardService {
    getStats(): Promise<IDashboardStats>;
    getRecentActivity(limit?: number): Promise<IRecentActivity[]>;
    getWasteAnalytics(days?: number): Promise<IWasteAnalytics[]>;
    getMaterialUsage(): Promise<{
        materialType: string;
        usageCount: number;
        wastePercentage: number;
    }[]>;
}
export declare class DashboardService implements IDashboardService {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    getStats(): Promise<IDashboardStats>;
    private getOrderStats;
    private getJobStats;
    private getStockStats;
    private getProductionStats;
    getRecentActivity(limit?: number): Promise<IRecentActivity[]>;
    getWasteAnalytics(days?: number): Promise<IWasteAnalytics[]>;
    private getWeekStart;
    getMaterialUsage(): Promise<{
        materialType: string;
        usageCount: number;
        wastePercentage: number;
    }[]>;
}
//# sourceMappingURL=dashboard.service.d.ts.map