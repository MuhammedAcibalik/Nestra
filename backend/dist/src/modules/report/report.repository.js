"use strict";
/**
 * Report Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== REPOSITORY ====================
class ReportRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getProductionStats(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.cuttingPlans.createdAt, filter.endDate));
        const result = await this.db.select({
            totalProduction: (0, drizzle_orm_1.sql) `count(*)`,
            completedCount: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingPlans.status} = 'COMPLETED' then 1 else 0 end)`,
            averageWaste: (0, drizzle_orm_1.sql) `avg(${schema_1.cuttingPlans.wastePercentage})`
        })
            .from(schema_1.cuttingPlans)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
        return {
            totalProduction: Number(result[0]?.totalProduction ?? 0),
            completedCount: Number(result[0]?.completedCount ?? 0),
            averageWaste: Number(result[0]?.averageWaste ?? 0)
        };
    }
    async getWasteData(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.cuttingPlans.createdAt, filter.endDate));
        const results = await this.db.select({
            createdAt: schema_1.cuttingPlans.createdAt,
            totalWaste: schema_1.cuttingPlans.totalWaste,
            wastePercentage: schema_1.cuttingPlans.wastePercentage
        })
            .from(schema_1.cuttingPlans)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cuttingPlans.createdAt));
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
    async getEfficiencyData(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.cuttingPlans.createdAt, filter.endDate));
        // Get plan stats
        const results = await this.db.select({
            planCount: (0, drizzle_orm_1.sql) `count(*)`,
            avgWaste: (0, drizzle_orm_1.sql) `avg(${schema_1.cuttingPlans.wastePercentage})`,
            totalWaste: (0, drizzle_orm_1.sql) `sum(${schema_1.cuttingPlans.totalWaste})`,
            stockUsed: (0, drizzle_orm_1.sql) `sum(${schema_1.cuttingPlans.stockUsedCount})`
        })
            .from(schema_1.cuttingPlans)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
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
    async getTotalPlanCount(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.cuttingPlans.createdAt, filter.endDate));
        const result = await this.db.select({
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.cuttingPlans)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
        return Number(result[0]?.count ?? 0);
    }
    async getCustomerData(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.orders.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.orders.createdAt, filter.endDate));
        if (filter?.customerId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.customerId, filter.customerId));
        const results = await this.db.select({
            customerId: schema_1.customers.id,
            customerName: schema_1.customers.name,
            customerCode: schema_1.customers.code,
            orderCount: (0, drizzle_orm_1.sql) `count(distinct ${schema_1.orders.id})`
        })
            .from(schema_1.customers)
            .leftJoin(schema_1.orders, (0, drizzle_orm_1.eq)(schema_1.customers.id, schema_1.orders.customerId))
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .groupBy(schema_1.customers.id, schema_1.customers.name, schema_1.customers.code);
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
    async getMachineData(filter) {
        const conditions = [];
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.cuttingPlans.createdAt, filter.endDate));
        const results = await this.db.select({
            machineId: schema_1.machines.id,
            machineName: schema_1.machines.name,
            machineCode: schema_1.machines.code,
            machineType: schema_1.machines.machineType,
            planCount: (0, drizzle_orm_1.sql) `count(${schema_1.cuttingPlans.id})`,
            avgWaste: (0, drizzle_orm_1.sql) `avg(${schema_1.cuttingPlans.wastePercentage})`
        })
            .from(schema_1.machines)
            .leftJoin(schema_1.cuttingPlans, (0, drizzle_orm_1.eq)(schema_1.machines.id, schema_1.cuttingPlans.machineId))
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .groupBy(schema_1.machines.id, schema_1.machines.name, schema_1.machines.code, schema_1.machines.machineType);
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
exports.ReportRepository = ReportRepository;
//# sourceMappingURL=report.repository.js.map