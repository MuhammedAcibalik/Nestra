/**
 * Report Repository
 * Following SRP - Only handles report data access
 */

import { PrismaClient, Prisma, CuttingPlan, Machine } from '@prisma/client';
import { IReportFilter } from '../../core/interfaces';

export interface WasteReportData {
    planId: string;
    planNumber: string;
    plannedWaste: number;
    actualWaste: number | null;
    wastePercentage: number;
    createdAt: Date;
}

export interface EfficiencyData {
    materialTypeId: string;
    materialName: string;
    planCount: number;
    avgEfficiency: number;
    totalStockUsed: number;
}

export interface CustomerReportData {
    customerId: string;
    customerCode: string;
    customerName: string;
    orderCount: number;
    itemCount: number;
}

export interface MachineReportData {
    machineId: string;
    machineCode: string;
    machineName: string;
    machineType: string;
    planCount: number;
    totalProductionTime: number;
    avgWastePercentage: number;
}

type PlanWithProductionLogs = CuttingPlan & {
    productionLogs: { actualWaste: number | null }[];
};

type MachineWithPlans = Machine & {
    cuttingPlans: (CuttingPlan & {
        productionLogs: { actualTime: number | null }[];
    })[];
};

interface PlanWhereInput {
    status?: string;
    machineId?: string;
    createdAt?: { gte?: Date; lte?: Date };
}

export interface IReportRepository {
    getWasteData(filter: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter: IReportFilter): Promise<EfficiencyData[]>;
    getCustomerData(filter: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter: IReportFilter): Promise<MachineReportData[]>;
    getTotalPlanCount(filter: IReportFilter): Promise<number>;
}

export class ReportRepository implements IReportRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async getWasteData(filter: IReportFilter): Promise<WasteReportData[]> {
        const where = this.buildPlanWhereClause(filter);

        const plans = await this.prisma.cuttingPlan.findMany({
            where: { ...where, status: 'COMPLETED' } as Prisma.CuttingPlanWhereInput,
            include: {
                productionLogs: {
                    select: { actualWaste: true },
                    take: 1,
                    orderBy: { completedAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        }) as PlanWithProductionLogs[];

        return plans.map((plan) => ({
            planId: plan.id,
            planNumber: plan.planNumber,
            plannedWaste: plan.totalWaste,
            actualWaste: plan.productionLogs[0]?.actualWaste ?? null,
            wastePercentage: plan.wastePercentage,
            createdAt: plan.createdAt
        }));
    }

    async getEfficiencyData(filter: IReportFilter): Promise<EfficiencyData[]> {
        const where = this.buildPlanWhereClause(filter);

        const result = await this.prisma.cuttingPlan.groupBy({
            by: ['scenarioId'],
            where: { ...where, status: 'COMPLETED' } as Prisma.CuttingPlanWhereInput,
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

    async getCustomerData(filter: IReportFilter): Promise<CustomerReportData[]> {
        const whereClause: Prisma.CustomerWhereInput = {};
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

    async getMachineData(filter: IReportFilter): Promise<MachineReportData[]> {
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
        }) as MachineWithPlans[];

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

    async getTotalPlanCount(filter: IReportFilter): Promise<number> {
        const where = this.buildPlanWhereClause(filter);
        return this.prisma.cuttingPlan.count({
            where: { ...where, status: 'COMPLETED' } as Prisma.CuttingPlanWhereInput
        });
    }

    private buildPlanWhereClause(filter: IReportFilter): PlanWhereInput {
        const where: PlanWhereInput = {};

        if (filter.startDate || filter.endDate) {
            where.createdAt = {};
            if (filter.startDate) where.createdAt.gte = filter.startDate;
            if (filter.endDate) where.createdAt.lte = filter.endDate;
        }
        if (filter.machineId) where.machineId = filter.machineId;

        return where;
    }
}
