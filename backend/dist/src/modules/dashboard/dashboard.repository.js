"use strict";
/**
 * Dashboard Repository
 * Handles data access for dashboard analytics
 * Following SRP - Only handles dashboard-related data queries
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRepository = void 0;
// ==================== REPOSITORY ====================
class DashboardRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
    async getRecentOrders(limit) {
        return this.prisma.order.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, orderNumber: true, status: true, updatedAt: true }
        });
    }
    async getRecentJobs(limit) {
        return this.prisma.cuttingJob.findMany({
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, jobNumber: true, status: true, updatedAt: true }
        });
    }
    async getCompletedPlansInPeriod(startDate) {
        return this.prisma.cuttingPlan.findMany({
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
    }
    async getCompletedJobsWithMaterials() {
        const jobs = await this.prisma.cuttingJob.findMany({
            where: { status: 'COMPLETED' },
            include: {
                scenarios: {
                    include: {
                        results: {
                            select: { wastePercentage: true }
                        }
                    }
                }
            }
        });
        return jobs.map(job => ({
            materialTypeId: job.materialTypeId,
            scenarios: job.scenarios.map(s => ({
                results: s.results.map(r => ({ wastePercentage: r.wastePercentage }))
            }))
        }));
    }
    async getAllMaterialTypes() {
        return this.prisma.materialType.findMany({
            select: { id: true, name: true }
        });
    }
}
exports.DashboardRepository = DashboardRepository;
//# sourceMappingURL=dashboard.repository.js.map