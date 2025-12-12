/**
 * Dashboard Service
 * Provides analytics and KPIs for the dashboard
 * Refactored to use repository injection instead of direct Prisma
 */

import {
    IDashboardRepository,
    IOrderStats,
    IJobStats,
    IStockStats,
    IProductionStats
} from './dashboard.repository';

// ==================== INTERFACES ====================

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

// ==================== SERVICE ====================

export class DashboardService implements IDashboardService {
    constructor(private readonly repository: IDashboardRepository) { }

    async getStats(): Promise<IDashboardStats> {
        const [orders, cuttingJobs, stock, production] = await Promise.all([
            this.repository.getOrderStats(),
            this.repository.getJobStats(),
            this.repository.getStockStats(),
            this.repository.getProductionStats()
        ]);

        return { orders, cuttingJobs, stock, production };
    }

    async getRecentActivity(limit = 10): Promise<IRecentActivity[]> {
        const activities: IRecentActivity[] = [];

        const [recentOrders, recentJobs] = await Promise.all([
            this.repository.getRecentOrders(limit),
            this.repository.getRecentJobs(limit)
        ]);

        for (const order of recentOrders) {
            activities.push({
                type: 'order',
                id: order.id,
                number: order.orderNumber,
                status: order.status,
                timestamp: order.updatedAt
            });
        }

        for (const job of recentJobs) {
            activities.push({
                type: 'cutting_job',
                id: job.id,
                number: job.jobNumber,
                status: job.status,
                timestamp: job.updatedAt
            });
        }

        // Sort and limit
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return activities.slice(0, limit);
    }

    async getWasteAnalytics(days = 30): Promise<IWasteAnalytics[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const plans = await this.repository.getCompletedPlansInPeriod(startDate);

        // Group by week
        const weeklyData = new Map<string, {
            totalWaste: number;
            wastePercentages: number[];
            count: number;
        }>();

        for (const plan of plans) {
            const weekStart = this.getWeekStart(plan.createdAt);
            const key = weekStart.toISOString().split('T')[0];

            const existing = weeklyData.get(key) ?? {
                totalWaste: 0,
                wastePercentages: [],
                count: 0
            };
            existing.totalWaste += plan.totalWaste;
            existing.wastePercentages.push(plan.wastePercentage);
            existing.count++;
            weeklyData.set(key, existing);
        }

        return Array.from(weeklyData.entries()).map(([period, data]) => ({
            period,
            totalWaste: data.totalWaste,
            wastePercentage: data.wastePercentages.reduce((a, b) => a + b, 0) / data.wastePercentages.length,
            planCount: data.count
        }));
    }

    private getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    async getMaterialUsage(): Promise<IMaterialUsage[]> {
        const [jobs, materialTypes] = await Promise.all([
            this.repository.getCompletedJobsWithMaterials(),
            this.repository.getAllMaterialTypes()
        ]);

        const materialNameMap = new Map(materialTypes.map(m => [m.id, m.name]));
        const materialStats = new Map<string, { count: number; wastePercentages: number[] }>();

        for (const job of jobs) {
            for (const scenario of job.scenarios) {
                for (const plan of scenario.results) {
                    const existing = materialStats.get(job.materialTypeId) ?? {
                        count: 0,
                        wastePercentages: []
                    };
                    existing.count++;
                    existing.wastePercentages.push(plan.wastePercentage);
                    materialStats.set(job.materialTypeId, existing);
                }
            }
        }

        return Array.from(materialStats.entries()).map(([id, data]) => ({
            materialType: materialNameMap.get(id) ?? id,
            usageCount: data.count,
            wastePercentage: data.wastePercentages.length > 0
                ? data.wastePercentages.reduce((a, b) => a + b, 0) / data.wastePercentages.length
                : 0
        }));
    }
}
