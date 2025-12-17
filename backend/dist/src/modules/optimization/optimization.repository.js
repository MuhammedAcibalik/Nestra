"use strict";
/**
 * Optimization Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class OptimizationRepository {
    db;
    planCounter = 1;
    constructor(db) {
        this.db = db;
    }
    async findScenarioById(id) {
        const result = await this.db.query.optimizationScenarios.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.id, id),
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            }
        });
        return result ?? null;
    }
    async findAllScenarios(filter) {
        const conditions = [];
        if (filter?.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.status, filter.status));
        if (filter?.cuttingJobId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.cuttingJobId, filter.cuttingJobId));
        if (filter?.createdById)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.createdById, filter.createdById));
        return this.db.query.optimizationScenarios.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.optimizationScenarios.createdAt)]
        });
    }
    async createScenario(data, userId) {
        const [result] = await this.db.insert(schema_1.optimizationScenarios).values({
            name: data.name,
            cuttingJobId: data.cuttingJobId,
            createdById: userId,
            parameters: data.parameters,
            useWarehouseStock: data.useWarehouseStock ?? true,
            useStandardSizes: data.useStandardSizes ?? true,
            selectedStockIds: data.selectedStockIds
        }).returning();
        return result;
    }
    async updateScenarioStatus(id, status) {
        const [result] = await this.db.update(schema_1.optimizationScenarios)
            .set({
            status: status,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.id, id))
            .returning();
        return result;
    }
    async findPlanById(id) {
        const result = await this.db.query.cuttingPlans.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.cuttingPlans.id, id),
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            }
        });
        if (!result)
            return null;
        // Add stockUsed as alias for stockItems
        return { ...result, stockUsed: result.stockItems };
    }
    async findAllPlans(filter) {
        const conditions = [];
        if (filter?.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.status, filter.status));
        if (filter?.scenarioId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.scenarioId, filter.scenarioId));
        const plans = await this.db.query.cuttingPlans.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.cuttingPlans.createdAt)]
        });
        return plans.map(p => ({ ...p, stockUsed: p.stockItems }));
    }
    async createPlan(scenarioId, data) {
        const planNumber = `PLN-${Date.now()}-${this.planCounter++}`;
        const [plan] = await this.db.insert(schema_1.cuttingPlans).values({
            planNumber,
            scenarioId,
            totalWaste: data.totalWaste,
            wastePercentage: data.wastePercentage,
            stockUsedCount: data.stockUsedCount,
            estimatedTime: data.estimatedTime,
            estimatedCost: data.estimatedCost
        }).returning();
        // Insert layout data as stock items
        if (data.layoutData && data.layoutData.length > 0) {
            await this.db.insert(schema_1.cuttingPlanStocks).values(data.layoutData.map(layout => ({
                cuttingPlanId: plan.id,
                stockItemId: layout.stockItemId,
                sequence: layout.sequence,
                waste: layout.waste,
                wastePercentage: layout.wastePercentage,
                layoutData: layout.layoutJson
            })));
        }
        return plan;
    }
    async updatePlanStatus(id, status, approvedById, machineId) {
        const [result] = await this.db.update(schema_1.cuttingPlans)
            .set({
            status: status,
            approvedById,
            machineId,
            approvedAt: approvedById ? new Date() : null,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.cuttingPlans.id, id))
            .returning();
        return result;
    }
    async getPlanStockItems(planId) {
        return this.db.select().from(schema_1.cuttingPlanStocks)
            .where((0, drizzle_orm_1.eq)(schema_1.cuttingPlanStocks.cuttingPlanId, planId));
    }
}
exports.OptimizationRepository = OptimizationRepository;
//# sourceMappingURL=optimization.repository.js.map