"use strict";
/**
 * Production Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../../core/database");
const tenant_1 = require("../../core/tenant");
class ProductionRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT FILTERING ====================
    getTenantFilter() {
        const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(schema_1.productionLogs.tenantId, tenantId);
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
    // ==================== PRODUCTION LOG OPERATIONS ====================
    async findById(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.productionLogs.id, id)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.productionLogs.findFirst({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            }
        });
        return result ?? null;
    }
    async findByPlanId(planId) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.productionLogs.cuttingPlanId, planId)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.productionLogs.findFirst({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.productionLogs.status, filter?.status)
            .eq(schema_1.productionLogs.cuttingPlanId, filter?.cuttingPlanId)
            .eq(schema_1.productionLogs.operatorId, filter?.operatorId)
            .eq(schema_1.productionLogs.tenantId, this.getCurrentTenantId())
            .build();
        return this.db.query.productionLogs.findMany({
            where,
            with: {
                cuttingPlan: true,
                operator: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.productionLogs.createdAt)]
        });
    }
    async create(planId, operatorId) {
        const [result] = await this.db
            .insert(schema_1.productionLogs)
            .values({
            tenantId: this.getCurrentTenantId(),
            cuttingPlanId: planId,
            operatorId: operatorId,
            startedAt: new Date()
        })
            .returning();
        return result;
    }
    async update(id, data) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.productionLogs.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db
            .update(schema_1.productionLogs)
            .set({
            actualWaste: data.actualWaste,
            actualTime: data.actualTime,
            status: data.status,
            completedAt: data.completedAt,
            notes: data.notes,
            issues: data.issues,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.productionLogs.id, id))
            .returning();
        return result;
    }
    async complete(logId, data) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.productionLogs.id, logId)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db
            .update(schema_1.productionLogs)
            .set({
            actualWaste: data.actualWaste,
            actualTime: data.actualTime,
            notes: data.notes,
            issues: data.issues,
            status: 'COMPLETED',
            completedAt: new Date(),
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.productionLogs.id, logId))
            .returning();
        return result;
    }
    // ==================== DOWNTIME METHODS ====================
    async createDowntime(input) {
        const [result] = await this.db
            .insert(schema_1.downtimeLogs)
            .values({
            productionLogId: input.productionLogId,
            machineId: input.machineId,
            reason: input.reason,
            notes: input.notes,
            startedAt: new Date()
        })
            .returning();
        return result;
    }
    async updateDowntime(id, endedAt, durationMinutes) {
        const [result] = await this.db
            .update(schema_1.downtimeLogs)
            .set({
            endedAt,
            durationMinutes
        })
            .where((0, drizzle_orm_1.eq)(schema_1.downtimeLogs.id, id))
            .returning();
        return result;
    }
    async findDowntimesByLogId(productionLogId) {
        return this.db.query.downtimeLogs.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.downtimeLogs.productionLogId, productionLogId),
            with: {
                machine: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.downtimeLogs.startedAt)]
        });
    }
    // ==================== QUALITY CHECK METHODS ====================
    async createQualityCheck(input) {
        const [result] = await this.db
            .insert(schema_1.qualityChecks)
            .values({
            productionLogId: input.productionLogId,
            result: input.result,
            passedCount: input.passedCount,
            failedCount: input.failedCount,
            defectTypes: input.defectTypes,
            inspectorId: input.inspectorId,
            notes: input.notes,
            checkedAt: new Date()
        })
            .returning();
        return result;
    }
    async findQualityChecksByLogId(productionLogId) {
        return this.db.query.qualityChecks.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.qualityChecks.productionLogId, productionLogId),
            with: {
                inspector: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.qualityChecks.checkedAt)]
        });
    }
}
exports.ProductionRepository = ProductionRepository;
//# sourceMappingURL=production.repository.js.map