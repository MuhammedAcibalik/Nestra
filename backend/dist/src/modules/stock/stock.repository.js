"use strict";
/**
 * Stock Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../../core/database");
const tenant_1 = require("../../core/tenant");
class StockRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT FILTERING ====================
    getTenantFilter() {
        const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(schema_1.stockItems.tenantId, tenantId);
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
    // ==================== READ OPERATIONS ====================
    async findById(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.stockItems.id, id)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.stockItems.findFirst({
            where,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.stockItems.materialTypeId, filter?.materialTypeId)
            .eq(schema_1.stockItems.stockType, filter?.stockType)
            .eq(schema_1.stockItems.locationId, filter?.locationId)
            .gte(schema_1.stockItems.quantity, filter?.minQuantity)
            .eq(schema_1.stockItems.tenantId, this.getCurrentTenantId())
            .build();
        return this.db.query.stockItems.findMany({
            where,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.stockItems.createdAt)]
        });
    }
    async findByCode(code) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.stockItems.code, code)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.stockItems.findFirst({
            where
        });
        return result ?? null;
    }
    // ==================== WRITE OPERATIONS ====================
    async create(data) {
        const [result] = await this.db.insert(schema_1.stockItems).values({
            tenantId: this.getCurrentTenantId(),
            code: data.code,
            name: data.name,
            materialTypeId: data.materialTypeId,
            thicknessRangeId: data.thicknessRangeId,
            thickness: data.thickness,
            stockType: data.stockType,
            length: data.length,
            width: data.width,
            height: data.height,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            locationId: data.locationId
        }).returning();
        return result;
    }
    async update(id, data) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.stockItems.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db.update(schema_1.stockItems)
            .set({
            code: data.code,
            name: data.name,
            thickness: data.thickness,
            stockType: data.stockType,
            length: data.length,
            width: data.width,
            height: data.height,
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.stockItems.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.stockItems.id, id)];
        const where = this.withTenantFilter(conditions);
        await this.db.delete(schema_1.stockItems).where(where ?? (0, drizzle_orm_1.eq)(schema_1.stockItems.id, id));
    }
    async updateQuantity(id, quantityDelta, reservedDelta = 0) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.stockItems.id, id)];
        const where = this.withTenantFilter(conditions);
        const current = await this.db.query.stockItems.findFirst({
            where
        });
        if (!current)
            throw new Error('Stock item not found');
        const [result] = await this.db.update(schema_1.stockItems)
            .set({
            quantity: current.quantity + quantityDelta,
            reservedQty: current.reservedQty + reservedDelta,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.stockItems.id, id))
            .returning();
        return result;
    }
    // ==================== MOVEMENTS ====================
    async createMovement(data) {
        const [result] = await this.db.insert(schema_1.stockMovements).values({
            stockItemId: data.stockItemId,
            movementType: data.movementType,
            quantity: data.quantity,
            notes: data.notes,
            productionLogId: data.productionLogId
        }).returning();
        return result;
    }
    async getMovements(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.stockMovements.stockItemId, filter?.stockItemId)
            .eq(schema_1.stockMovements.movementType, filter?.movementType)
            .gte(schema_1.stockMovements.createdAt, filter?.startDate)
            .lte(schema_1.stockMovements.createdAt, filter?.endDate)
            .build();
        return this.db.select().from(schema_1.stockMovements)
            .where(where)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.stockMovements.createdAt))
            .limit(100);
    }
}
exports.StockRepository = StockRepository;
//# sourceMappingURL=stock.repository.js.map