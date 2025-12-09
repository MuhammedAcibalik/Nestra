"use strict";
/**
 * Report Repository
 * Following SRP - Only handles report data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRepository = void 0;
class ReportRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWasteData(filter) {
        const where = this.buildPlanWhereClause(filter);
        const plans = await this.prisma.cuttingPlan.findMany({
            where: { ...where, status: 'COMPLETED' },
            include: {
                productionLogs: {
                    select: { actualWaste: true },
                    take: 1,
                    orderBy: { completedAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return plans.map((plan) => ({
            planId: plan.id,
            planNumber: plan.planNumber,
            plannedWaste: plan.totalWaste,
            actualWaste: plan.productionLogs[0]?.actualWaste ?? null,
            wastePercentage: plan.wastePercentage,
            createdAt: plan.createdAt
        }));
    }
    async getEfficiencyData(filter) {
        const where = this.buildPlanWhereClause(filter);
        const result = await this.prisma.cuttingPlan.groupBy({
            by: ['scenarioId'],
            where: { ...where, status: 'COMPLETED' },
            _count: { id: true },
            _avg: { wastePercentage: true },
            _sum: { stockUsedCount: true }
        });
        return result.map((r) => ({
            materialTypeId: '',
            materialName: 'Material',
            planCount: r._count.id,
            avgEfficiency: 100 - (r._avg.wastePercentage ?? 0),
            totalStockUsed: r._sum.stockUsedCount ?? 0
        }));
    }
    async getCustomerData(filter) {
        const whereClause = {};
        if (filter.customerId) {
            whereClause.id = filter.customerId;
        }
        const customers = await this.prisma.customer.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                orders: {
                    include: {
                        _count: { select: { items: true } }
                    },
                    where: filter.startDate || filter.endDate ? {
                        createdAt: {
                            gte: filter.startDate,
                            lte: filter.endDate
                        }
                    } : undefined
                }
            }
        });
        return customers.map((customer) => {
            let itemCount = 0;
            for (const order of customer.orders) {
                itemCount += order._count.items;
            }
            return {
                customerId: customer.id,
                customerCode: customer.code,
                customerName: customer.name,
                orderCount: customer.orders.length,
                itemCount
            };
        });
    }
    async getMachineData(filter) {
        const machines = await this.prisma.machine.findMany({
            where: filter.machineId ? { id: filter.machineId } : { isActive: true },
            include: {
                cuttingPlans: {
                    where: { status: 'COMPLETED' },
                    include: {
                        productionLogs: {
                            where: { status: 'COMPLETED' },
                            select: { actualTime: true }
                        }
                    }
                }
            }
        });
        return machines.map((machine) => {
            let totalProductionTime = 0;
            let totalWastePercentage = 0;
            for (const plan of machine.cuttingPlans) {
                totalWastePercentage += plan.wastePercentage;
                for (const log of plan.productionLogs) {
                    totalProductionTime += log.actualTime ?? 0;
                }
            }
            const planCount = machine.cuttingPlans.length;
            return {
                machineId: machine.id,
                machineCode: machine.code,
                machineName: machine.name,
                machineType: machine.machineType,
                planCount,
                totalProductionTime,
                avgWastePercentage: planCount > 0 ? totalWastePercentage / planCount : 0
            };
        });
    }
    async getTotalPlanCount(filter) {
        const where = this.buildPlanWhereClause(filter);
        return this.prisma.cuttingPlan.count({
            where: { ...where, status: 'COMPLETED' }
        });
    }
    buildPlanWhereClause(filter) {
        const where = {};
        if (filter.startDate || filter.endDate) {
            where.createdAt = {};
            if (filter.startDate)
                where.createdAt.gte = filter.startDate;
            if (filter.endDate)
                where.createdAt.lte = filter.endDate;
        }
        if (filter.machineId)
            where.machineId = filter.machineId;
        return where;
    }
}
exports.ReportRepository = ReportRepository;
//# sourceMappingURL=report.repository.js.map