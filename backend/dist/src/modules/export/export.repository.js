"use strict";
/**
 * Export Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== REPOSITORY ====================
class ExportRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async getStockItemsForExport() {
        const results = await this.db.query.stockItems.findMany({
            with: {
                materialType: true,
                location: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.stockItems.createdAt)]
        });
        return results.map(item => ({
            id: item.id,
            code: item.code,
            materialTypeName: item.materialType?.name ?? '',
            stockType: item.stockType,
            length: item.length,
            width: item.width,
            quantity: item.quantity,
            locationName: item.location?.name ?? null
        }));
    }
    async getMaterialsForExport() {
        const results = await this.db.select({
            id: schema_1.materialTypes.id,
            name: schema_1.materialTypes.name,
            description: schema_1.materialTypes.description,
            defaultDensity: schema_1.materialTypes.defaultDensity
        }).from(schema_1.materialTypes);
        return results;
    }
    async getCustomersForExport() {
        const results = await this.db.select({
            id: schema_1.customers.id,
            code: schema_1.customers.code,
            name: schema_1.customers.name,
            email: schema_1.customers.email,
            phone: schema_1.customers.phone,
            address: schema_1.customers.address
        }).from(schema_1.customers);
        return results;
    }
    async getOrdersForExport() {
        const results = await this.db.query.orders.findMany({
            with: {
                items: true,
                customer: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.orders.createdAt)]
        });
        return results.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer?.name ?? null,
            status: order.status,
            itemCount: order.items?.length ?? 0,
            createdAt: order.createdAt
        }));
    }
    async getCuttingPlansForExport() {
        const results = await this.db.query.cuttingPlans.findMany({
            with: {
                stockItems: true,
                scenario: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.cuttingPlans.createdAt)]
        });
        return results.map(plan => ({
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            scenarioName: plan.scenario?.name ?? null,
            materialTypeId: null,
            thickness: null,
            status: plan.status,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            stockItems: (plan.stockItems ?? []).map(si => ({
                stockItemId: si.stockItemId,
                sequence: si.sequence,
                waste: si.waste,
                wastePercentage: si.wastePercentage,
                layoutData: si.layoutData
            })),
            createdAt: plan.createdAt
        }));
    }
    async findPlanById(planId) {
        const result = await this.db.query.cuttingPlans.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.cuttingPlans.id, planId),
            with: {
                stockItems: true,
                scenario: true
            }
        });
        if (!result)
            return null;
        return {
            id: result.id,
            planNumber: result.planNumber,
            scenarioId: result.scenarioId,
            scenarioName: result.scenario?.name ?? null,
            materialTypeId: null,
            thickness: null,
            status: result.status,
            totalWaste: result.totalWaste,
            wastePercentage: result.wastePercentage,
            stockUsedCount: result.stockUsedCount,
            stockItems: (result.stockItems ?? []).map(si => ({
                stockItemId: si.stockItemId,
                sequence: si.sequence,
                waste: si.waste,
                wastePercentage: si.wastePercentage,
                layoutData: si.layoutData
            })),
            createdAt: result.createdAt
        };
    }
    async findMaterialTypeById(materialTypeId) {
        const result = await this.db.select({
            id: schema_1.materialTypes.id,
            name: schema_1.materialTypes.name,
            description: schema_1.materialTypes.description
        })
            .from(schema_1.materialTypes)
            .where((0, drizzle_orm_1.eq)(schema_1.materialTypes.id, materialTypeId))
            .limit(1);
        return result[0] ?? null;
    }
}
exports.ExportRepository = ExportRepository;
//# sourceMappingURL=export.repository.js.map