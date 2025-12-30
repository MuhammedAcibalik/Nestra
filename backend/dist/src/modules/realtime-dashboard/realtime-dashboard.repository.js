"use strict";
/**
 * Real-time Dashboard Repository
 * Data access for dashboard metrics and real-time data
 * Following Repository Pattern with Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeDashboardRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/schema");
// ==================== REPOSITORY ====================
class RealtimeDashboardRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    // ==================== KPIs ====================
    async getActiveProductionCount(tenantId) {
        const result = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.productionLogs)
            .where((0, drizzle_orm_1.and)(
        // Note: Production logs don't have tenantId yet in schema
        // This will be added during migration
        (0, drizzle_orm_1.eq)(schema_1.productionLogs.status, 'STARTED')));
        return result[0]?.count ?? 0;
    }
    async getPendingOptimizationCount(tenantId) {
        const result = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.optimizationScenarios)
            .where((0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.status, 'PENDING'));
        return result[0]?.count ?? 0;
    }
    async getPendingOrderCount(tenantId) {
        const result = await this.db.select({ count: (0, drizzle_orm_1.count)() }).from(schema_1.orders).where((0, drizzle_orm_1.eq)(schema_1.orders.status, 'DRAFT'));
        return result[0]?.count ?? 0;
    }
    async getLowStockCount(tenantId) {
        // Count items where quantity is below a threshold (e.g., 10)
        const result = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.stockItems)
            .where((0, drizzle_orm_1.sql) `${schema_1.stockItems.quantity} < 10`);
        return result[0]?.count ?? 0;
    }
    async getTodayWastePercentage(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.db
            .select({
            avgWaste: (0, drizzle_orm_1.sql) `AVG(${schema_1.cuttingPlans.wastePercentage})`
        })
            .from(schema_1.cuttingPlans)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.status, 'COMPLETED'), (0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, today)));
        return result[0]?.avgWaste ?? 0;
    }
    async getTodayCompletedPlanCount(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await this.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.cuttingPlans)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.status, 'COMPLETED'), (0, drizzle_orm_1.gte)(schema_1.cuttingPlans.createdAt, today)));
        return result[0]?.count ?? 0;
    }
    // ==================== LISTS ====================
    async getActiveProductions(tenantId, limit = 10) {
        const result = await this.db.query.productionLogs.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.productionLogs.status, 'STARTED'),
            limit,
            orderBy: (0, drizzle_orm_1.desc)(schema_1.productionLogs.startedAt),
            with: {
                cuttingPlan: true
            }
        });
        return result.map((p) => ({
            id: p.id,
            planNumber: p.cuttingPlan?.planNumber ?? 'Unknown',
            status: p.status,
            progress: this.calculateProgress(p),
            operatorId: p.operatorId,
            startedAt: p.startedAt
        }));
    }
    async getRunningOptimizations(tenantId) {
        const result = await this.db.query.optimizationScenarios.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.status, 'RUNNING'),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.optimizationScenarios.createdAt)
        });
        return result.map((s) => ({
            id: s.id,
            name: s.name,
            status: s.status,
            createdAt: s.createdAt
        }));
    }
    async getLowStockItems(tenantId, limit = 10) {
        const result = await this.db
            .select()
            .from(schema_1.stockItems)
            .where((0, drizzle_orm_1.sql) `${schema_1.stockItems.quantity} < 20`)
            .orderBy(schema_1.stockItems.quantity)
            .limit(limit);
        return result.map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            quantity: item.quantity,
            alertLevel: this.getAlertLevel(item.quantity)
        }));
    }
    async getRecentActivities(tenantId, limit = 20) {
        const result = await this.db.query.activities.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.activities.tenantId, tenantId),
            orderBy: (0, drizzle_orm_1.desc)(schema_1.activities.createdAt),
            limit
        });
        return result.map((a) => ({
            id: a.id,
            activityType: a.activityType,
            actorId: a.actorId,
            targetType: a.targetType,
            targetId: a.targetId,
            metadata: a.metadata,
            createdAt: a.createdAt
        }));
    }
    // ==================== STATS ====================
    async getOrderStats(tenantId) {
        const result = await this.db
            .select({
            status: schema_1.orders.status,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.orders)
            .groupBy(schema_1.orders.status);
        const stats = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0
        };
        for (const row of result) {
            stats.total += row.count;
            if (row.status === 'DRAFT' || row.status === 'CONFIRMED') {
                stats.pending += row.count;
            }
            else if (row.status === 'IN_PRODUCTION' || row.status === 'IN_PLANNING') {
                stats.inProgress += row.count;
            }
            else if (row.status === 'COMPLETED') {
                stats.completed += row.count;
            }
        }
        return stats;
    }
    async getProductionStats(tenantId) {
        const result = await this.db
            .select({
            status: schema_1.productionLogs.status,
            count: (0, drizzle_orm_1.count)()
        })
            .from(schema_1.productionLogs)
            .groupBy(schema_1.productionLogs.status);
        const stats = {
            active: 0,
            completed: 0,
            paused: 0
        };
        for (const row of result) {
            if (row.status === 'STARTED') {
                stats.active += row.count;
            }
            else if (row.status === 'COMPLETED') {
                stats.completed += row.count;
            }
            else if (row.status === 'PAUSED' || row.status === 'CANCELLED') {
                stats.paused += row.count;
            }
        }
        return stats;
    }
    // ==================== HELPERS ====================
    calculateProgress(production) {
        // Simplified progress calculation
        // In real implementation, this would be based on completed pieces
        return 0;
    }
    getAlertLevel(quantity) {
        if (quantity <= 0)
            return 'OUT_OF_STOCK';
        if (quantity < 5)
            return 'CRITICAL';
        return 'WARNING';
    }
}
exports.RealtimeDashboardRepository = RealtimeDashboardRepository;
//# sourceMappingURL=realtime-dashboard.repository.js.map