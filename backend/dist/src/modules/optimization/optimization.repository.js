"use strict";
/**
 * Optimization Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../../core/database");
const tenant_1 = require("../../core/tenant");
class OptimizationRepository {
    db;
    planCounter = 1;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT FILTERING ====================
    getTenantFilter() {
        const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.tenantId, tenantId);
    }
    withTenantFilter(conditions) {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter)
            conditions.push(tenantFilter);
        return conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    }
    getCurrentTenantId() {
        return (0, tenant_1.getCurrentTenantIdOptional)();
    }
    // ==================== SCENARIO OPERATIONS ====================
    async findScenarioById(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.id, id)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.optimizationScenarios.findFirst({
            where,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            }
        });
        return result ?? null;
    }
    async findAllScenarios(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.optimizationScenarios.status, filter?.status)
            .eq(schema_1.optimizationScenarios.cuttingJobId, filter?.cuttingJobId)
            .eq(schema_1.optimizationScenarios.createdById, filter?.createdById)
            .eq(schema_1.optimizationScenarios.tenantId, this.getCurrentTenantId())
            .build();
        return this.db.query.optimizationScenarios.findMany({
            where,
            with: {
                results: true,
                cuttingJob: true,
                createdBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.optimizationScenarios.createdAt)]
        });
    }
    async createScenario(data, userId) {
        const [result] = await this.db
            .insert(schema_1.optimizationScenarios)
            .values({
            tenantId: this.getCurrentTenantId(),
            name: data.name,
            cuttingJobId: data.cuttingJobId,
            createdById: userId,
            parameters: data.parameters,
            useWarehouseStock: data.useWarehouseStock ?? true,
            useStandardSizes: data.useStandardSizes ?? true,
            selectedStockIds: data.selectedStockIds
        })
            .returning();
        return result;
    }
    async updateScenarioStatus(id, status) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db
            .update(schema_1.optimizationScenarios)
            .set({
            status: status,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.optimizationScenarios.id, id))
            .returning();
        return result;
    }
    // ==================== PLAN OPERATIONS ====================
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
        return { ...result, stockUsed: result.stockItems };
    }
    async findAllPlans(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.cuttingPlans.status, filter?.status)
            .eq(schema_1.cuttingPlans.scenarioId, filter?.scenarioId)
            .build();
        const plans = await this.db.query.cuttingPlans.findMany({
            where,
            with: {
                stockItems: true,
                scenario: true,
                approvedBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.cuttingPlans.createdAt)]
        });
        return plans.map((p) => ({ ...p, stockUsed: p.stockItems }));
    }
    async createPlan(scenarioId, data) {
        const planNumber = `PLN-${Date.now()}-${this.planCounter++}`;
        const [plan] = await this.db
            .insert(schema_1.cuttingPlans)
            .values({
            planNumber,
            scenarioId,
            totalWaste: data.totalWaste,
            wastePercentage: data.wastePercentage,
            stockUsedCount: data.stockUsedCount,
            estimatedTime: data.estimatedTime,
            estimatedCost: data.estimatedCost
        })
            .returning();
        if (data.layoutData && data.layoutData.length > 0) {
            await this.db.insert(schema_1.cuttingPlanStocks).values(data.layoutData.map((layout) => ({
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
        const [result] = await this.db
            .update(schema_1.cuttingPlans)
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
        return this.db.select().from(schema_1.cuttingPlanStocks).where((0, drizzle_orm_1.eq)(schema_1.cuttingPlanStocks.cuttingPlanId, planId));
    }
}
exports.OptimizationRepository = OptimizationRepository;
//# sourceMappingURL=optimization.repository.js.map