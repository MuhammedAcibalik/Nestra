/**
 * Report Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { cuttingPlans, orders, customers, machines } from '../../db/schema';
import { sql, gte, lte, and, eq, desc } from 'drizzle-orm';

// ==================== TYPE DEFINITIONS ====================

export interface IReportFilter {
    startDate?: Date;
    endDate?: Date;
    materialTypeId?: string;
    customerId?: string;
}

export interface WasteReportData {
    date: Date;
    createdAt: Date;
    materialTypeName: string;
    totalWaste: number;
    plannedWaste: number;
    actualWaste: number | null;
    wastePercentage: number;
    planCount: number;
}

export interface EfficiencyData {
    materialTypeId: string;
    materialTypeName: string;
    materialName: string;
    avgEfficiency: number;
    planCount: number;
    totalWaste: number;
    totalStockUsed: number;
}

export interface CustomerReportData {
    customerId: string;
    customerName: string;
    customerCode: string;
    orderCount: number;
    totalItems: number;
    itemCount: number;
    completedPlans: number;
}

export interface MachineReportData {
    machineId: string;
    machineName: string;
    machineCode: string;
    machineType: string;
    planCount: number;
    totalProduction: number;
    totalProductionTime: number;
    avgEfficiency: number;
    avgWastePercentage: number;
}

export interface IProductionStats {
    totalProduction: number;
    completedCount: number;
    averageWaste: number;
}

// ==================== INTERFACE ====================

export interface IReportRepository {
    getProductionStats(filter?: IReportFilter): Promise<IProductionStats>;
    getWasteData(filter?: IReportFilter): Promise<WasteReportData[]>;
    getEfficiencyData(filter?: IReportFilter): Promise<EfficiencyData[]>;
    getTotalPlanCount(filter?: IReportFilter): Promise<number>;
    getCustomerData(filter?: IReportFilter): Promise<CustomerReportData[]>;
    getMachineData(filter?: IReportFilter): Promise<MachineReportData[]>;
}

// ==================== REPOSITORY ====================

export class ReportRepository implements IReportRepository {
    constructor(private readonly db: Database) { }

    async getProductionStats(filter?: IReportFilter): Promise<IProductionStats> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        const result = await this.db.select({
            totalProduction: sql<number>`count(*)`,
            completedCount: sql<number>`sum(case when ${cuttingPlans.status} = 'COMPLETED' then 1 else 0 end)`,
            averageWaste: sql<number>`avg(${cuttingPlans.wastePercentage})`
        })
            .from(cuttingPlans)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        return {
            totalProduction: Number(result[0]?.totalProduction ?? 0),
            completedCount: Number(result[0]?.completedCount ?? 0),
            averageWaste: Number(result[0]?.averageWaste ?? 0)
        };
    }

    async getWasteData(filter?: IReportFilter): Promise<WasteReportData[]> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        const results = await this.db.select({
            createdAt: cuttingPlans.createdAt,
            totalWaste: cuttingPlans.totalWaste,
            wastePercentage: cuttingPlans.wastePercentage
        })
            .from(cuttingPlans)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(cuttingPlans.createdAt));

        return results.map(row => ({
            date: row.createdAt,
            createdAt: row.createdAt,
            materialTypeName: 'All Materials',
            totalWaste: row.totalWaste,
            plannedWaste: row.totalWaste,
            actualWaste: row.totalWaste,
            wastePercentage: row.wastePercentage,
            planCount: 1
        }));
    }

    async getEfficiencyData(filter?: IReportFilter): Promise<EfficiencyData[]> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        // Get plan stats
        const results = await this.db.select({
            planCount: sql<number>`count(*)`,
            avgWaste: sql<number>`avg(${cuttingPlans.wastePercentage})`,
            totalWaste: sql<number>`sum(${cuttingPlans.totalWaste})`,
            stockUsed: sql<number>`sum(${cuttingPlans.stockUsedCount})`
        })
            .from(cuttingPlans)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        return [{
            materialTypeId: 'all',
            materialTypeName: 'All Materials',
            materialName: 'All Materials',
            avgEfficiency: 100 - Number(results[0]?.avgWaste ?? 0),
            planCount: Number(results[0]?.planCount ?? 0),
            totalWaste: Number(results[0]?.totalWaste ?? 0),
            totalStockUsed: Number(results[0]?.stockUsed ?? 0)
        }];
    }

    async getTotalPlanCount(filter?: IReportFilter): Promise<number> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        const result = await this.db.select({
            count: sql<number>`count(*)`
        })
            .from(cuttingPlans)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        return Number(result[0]?.count ?? 0);
    }

    async getCustomerData(filter?: IReportFilter): Promise<CustomerReportData[]> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(orders.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(orders.createdAt, filter.endDate));
        if (filter?.customerId) conditions.push(eq(orders.customerId, filter.customerId));

        const results = await this.db.select({
            customerId: customers.id,
            customerName: customers.name,
            customerCode: customers.code,
            orderCount: sql<number>`count(distinct ${orders.id})`
        })
            .from(customers)
            .leftJoin(orders, eq(customers.id, orders.customerId))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(customers.id, customers.name, customers.code);

        return results.map(row => ({
            customerId: row.customerId,
            customerName: row.customerName,
            customerCode: row.customerCode,
            orderCount: Number(row.orderCount ?? 0),
            totalItems: 0,
            itemCount: 0,
            completedPlans: 0
        }));
    }

    async getMachineData(filter?: IReportFilter): Promise<MachineReportData[]> {
        const conditions = [];

        if (filter?.startDate) conditions.push(gte(cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate) conditions.push(lte(cuttingPlans.createdAt, filter.endDate));

        const results = await this.db.select({
            machineId: machines.id,
            machineName: machines.name,
            machineCode: machines.code,
            machineType: machines.machineType,
            planCount: sql<number>`count(${cuttingPlans.id})`,
            avgWaste: sql<number>`avg(${cuttingPlans.wastePercentage})`
        })
            .from(machines)
            .leftJoin(cuttingPlans, eq(machines.id, cuttingPlans.machineId))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(machines.id, machines.name, machines.code, machines.machineType);

        return results.map(row => ({
            machineId: row.machineId,
            machineName: row.machineName,
            machineCode: row.machineCode,
            machineType: row.machineType,
            planCount: Number(row.planCount ?? 0),
            totalProduction: Number(row.planCount ?? 0),
            totalProductionTime: Number(row.planCount ?? 0) * 60, // Estimate 60 min per plan
            avgEfficiency: 100 - Number(row.avgWaste ?? 0),
            avgWastePercentage: Number(row.avgWaste ?? 0)
        }));
    }
}
