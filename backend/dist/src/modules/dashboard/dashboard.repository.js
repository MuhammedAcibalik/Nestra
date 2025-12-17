"use strict";
/**
 * Dashboard Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== REPOSITORY ====================
class DashboardRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getOrderStats() {
        const [stats] = await this.db.select({
            total: (0, drizzle_orm_1.sql) `count(*)`,
            pending: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.orders.status} in ('DRAFT', 'CONFIRMED') then 1 else 0 end)`,
            inProgress: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.orders.status} in ('IN_PLANNING', 'IN_PRODUCTION') then 1 else 0 end)`,
            completed: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.orders.status} = 'COMPLETED' then 1 else 0 end)`
        }).from(schema_1.orders);
        return {
            total: Number(stats?.total ?? 0),
            pending: Number(stats?.pending ?? 0),
            inProgress: Number(stats?.inProgress ?? 0),
            completed: Number(stats?.completed ?? 0)
        };
    }
    async getJobStats() {
        const [stats] = await this.db.select({
            total: (0, drizzle_orm_1.sql) `count(*)`,
            pending: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingJobs.status} = 'PENDING' then 1 else 0 end)`,
            optimizing: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingJobs.status} = 'OPTIMIZING' then 1 else 0 end)`,
            completed: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingJobs.status} = 'COMPLETED' then 1 else 0 end)`
        }).from(schema_1.cuttingJobs);
        return {
            total: Number(stats?.total ?? 0),
            pending: Number(stats?.pending ?? 0),
            optimizing: Number(stats?.optimizing ?? 0),
            completed: Number(stats?.completed ?? 0)
        };
    }
    async getStockStats() {
        const [stats] = await this.db.select({
            totalItems: (0, drizzle_orm_1.sql) `count(*)`,
            lowStockItems: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.stockItems.quantity} < 10 then 1 else 0 end)`,
            totalValue: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.stockItems.quantity} * ${schema_1.stockItems.unitPrice}), 0)`
        }).from(schema_1.stockItems);
        return {
            totalItems: Number(stats?.totalItems ?? 0),
            lowStockItems: Number(stats?.lowStockItems ?? 0),
            totalValue: Number(stats?.totalValue ?? 0)
        };
    }
    async getProductionStats() {
        const [planStats] = await this.db.select({
            totalPlans: (0, drizzle_orm_1.sql) `count(*)`,
            activePlans: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingPlans.status} in ('APPROVED', 'IN_PRODUCTION') then 1 else 0 end)`,
            completedPlans: (0, drizzle_orm_1.sql) `sum(case when ${schema_1.cuttingPlans.status} = 'COMPLETED' then 1 else 0 end)`,
            avgWastePercentage: (0, drizzle_orm_1.sql) `coalesce(avg(${schema_1.cuttingPlans.wastePercentage}), 0)`
        }).from(schema_1.cuttingPlans);
        return {
            totalPlans: Number(planStats?.totalPlans ?? 0),
            activePlans: Number(planStats?.activePlans ?? 0),
            completedPlans: Number(planStats?.completedPlans ?? 0),
            avgWastePercentage: Number(planStats?.avgWastePercentage ?? 0)
        };
    }
    async getRecentOrders(limit = 10) {
        const result = await this.db.select({
            id: schema_1.orders.id,
            orderNumber: schema_1.orders.orderNumber,
            status: schema_1.orders.status,
            updatedAt: schema_1.orders.updatedAt
        })
            .from(schema_1.orders)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.orders.updatedAt))
            .limit(limit);
        return result.map(r => ({
            id: r.id,
            orderNumber: r.orderNumber,
            status: r.status,
            updatedAt: r.updatedAt
        }));
    }
    async getRecentJobs(limit = 10) {
        const result = await this.db.select({
            id: schema_1.cuttingJobs.id,
            jobNumber: schema_1.cuttingJobs.jobNumber,
            status: schema_1.cuttingJobs.status,
            updatedAt: schema_1.cuttingJobs.updatedAt
        })
            .from(schema_1.cuttingJobs)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cuttingJobs.updatedAt))
            .limit(limit);
        return result.map(r => ({
            id: r.id,
            jobNumber: String(r.jobNumber),
            status: r.status,
            updatedAt: r.updatedAt
        }));
    }
    async getCompletedPlansInPeriod(startDate) {
        const result = await this.db.select({
            id: schema_1.cuttingPlans.id,
            totalWaste: schema_1.cuttingPlans.totalWaste,
            wastePercentage: schema_1.cuttingPlans.wastePercentage,
            createdAt: schema_1.cuttingPlans.createdAt
        })
            .from(schema_1.cuttingPlans)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.status, 'COMPLETED'), (0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, startDate)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.cuttingPlans.createdAt));
        return result;
    }
    async getCompletedJobsWithMaterials() {
        const jobs = await this.db.query.cuttingJobs.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.cuttingJobs.status, 'COMPLETED'),
            with: {
                items: true
            }
        });
        // Scenarios relation not on cuttingJobs - return simplified data
        return jobs.map(job => ({
            materialTypeId: job.materialTypeId,
            scenarios: []
        }));
    }
    async getAllMaterialTypes() {
        return this.db.select({
            id: schema_1.materialTypes.id,
            name: schema_1.materialTypes.name
        }).from(schema_1.materialTypes);
    }
}
exports.DashboardRepository = DashboardRepository;
//# sourceMappingURL=dashboard.repository.js.map