"use strict";
/**
 * Dashboard Service
 * Provides analytics and KPIs for the dashboard
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const [orderStats, jobStats, stockStats, productionStats] = await Promise.all([
            this.getOrderStats(),
            this.getJobStats(),
            this.getStockStats(),
            this.getProductionStats()
        ]);
        return {
            orders: orderStats,
            cuttingJobs: jobStats,
            stock: stockStats,
            production: productionStats
        };
    }
    async getOrderStats() {
        const [total, pending, inProduction, completed] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'DRAFT' } }),
            this.prisma.order.count({ where: { status: 'IN_PRODUCTION' } }),
            this.prisma.order.count({ where: { status: 'COMPLETED' } })
        ]);
        return { total, pending, inProduction, completed };
    }
    async getJobStats() {
        const [total, pending, optimizing, inProduction] = await Promise.all([
            this.prisma.cuttingJob.count(),
            this.prisma.cuttingJob.count({ where: { status: 'PENDING' } }),
            this.prisma.cuttingJob.count({ where: { status: 'OPTIMIZING' } }),
            this.prisma.cuttingJob.count({ where: { status: 'IN_PRODUCTION' } })
        ]);
        return { total, pending, optimizing, inProduction };
    }
    async getStockStats() {
        const stockItems = await this.prisma.stockItem.findMany({
            select: { quantity: true, unitPrice: true }
        });
        const totalItems = stockItems.length;
        const lowStockCount = stockItems.filter(s => s.quantity < 5).length;
        const totalValue = stockItems.reduce((sum, s) => sum + (s.quantity * (s.unitPrice ?? 0)), 0);
        return { totalItems, lowStockCount, totalValue };
    }
    async getProductionStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [activePlans, completedToday, averageWaste] = await Promise.all([
            this.prisma.cuttingPlan.count({ where: { status: 'IN_PRODUCTION' } }),
            this.prisma.cuttingPlan.count({
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: today }
                }
            }),
            this.prisma.cuttingPlan.aggregate({
                _avg: { wastePercentage: true },
                where: { status: 'COMPLETED' }
            })
        ]);
        return {
            activePlans,
            completedToday,
            averageWastePercentage: averageWaste._avg.wastePercentage ?? 0
        };
    }
    async getRecentActivity(limit = 10) {
        const activities = [];
        // Recent orders
        const recentOrders = await this.prisma.order.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, orderNumber: true, status: true, updatedAt: true }
        });
        for (const order of recentOrders) {
            activities.push({
                type: 'order',
                id: order.id,
                number: order.orderNumber,
                status: order.status,
                timestamp: order.updatedAt
            });
        }
        // Recent cutting jobs
        const recentJobs = await this.prisma.cuttingJob.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, jobNumber: true, status: true, updatedAt: true }
        });
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
    async getWasteAnalytics(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const plans = await this.prisma.cuttingPlan.findMany({
            where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                totalWaste: true,
                wastePercentage: true
            },
            orderBy: { createdAt: 'asc' }
        });
        // Group by week
        const weeklyData = new Map();
        for (const plan of plans) {
            const weekStart = this.getWeekStart(plan.createdAt);
            const key = weekStart.toISOString().split('T')[0];
            const existing = weeklyData.get(key) ?? { totalWaste: 0, wastePercentages: [], count: 0 };
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
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    async getMaterialUsage() {
        const jobs = await this.prisma.cuttingJob.findMany({
            where: { status: 'COMPLETED' },
            include: {
                scenarios: {
                    include: {
                        results: true
                    }
                }
            }
        });
        const materialStats = new Map();
        for (const job of jobs) {
            for (const scenario of job.scenarios) {
                for (const plan of scenario.results) {
                    const existing = materialStats.get(job.materialTypeId) ?? { count: 0, wastePercentages: [] };
                    existing.count++;
                    existing.wastePercentages.push(plan.wastePercentage);
                    materialStats.set(job.materialTypeId, existing);
                }
            }
        }
        const materialTypes = await this.prisma.materialType.findMany();
        const materialNameMap = new Map(materialTypes.map(m => [m.id, m.name]));
        return Array.from(materialStats.entries()).map(([id, data]) => ({
            materialType: materialNameMap.get(id) ?? id,
            usageCount: data.count,
            wastePercentage: data.wastePercentages.length > 0
                ? data.wastePercentages.reduce((a, b) => a + b, 0) / data.wastePercentages.length
                : 0
        }));
    }
}
exports.DashboardService = DashboardService;
//# sourceMappingURL=dashboard.service.js.map