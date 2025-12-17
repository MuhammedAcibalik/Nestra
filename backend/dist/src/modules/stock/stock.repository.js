"use strict";
/**
 * Stock Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class StockRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.stockItems.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.stockItems.id, id),
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const conditions = [];
        if (filter?.materialTypeId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockItems.materialTypeId, filter.materialTypeId));
        if (filter?.stockType)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockItems.stockType, filter.stockType));
        if (filter?.locationId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockItems.locationId, filter.locationId));
        if (filter?.minQuantity !== undefined)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.stockItems.quantity, filter.minQuantity));
        return this.db.query.stockItems.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            with: {
                materialType: true,
                thicknessRange: true,
                location: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.stockItems.createdAt)]
        });
    }
    async findByCode(code) {
        const result = await this.db.query.stockItems.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.stockItems.code, code)
        });
        return result ?? null;
    }
    async create(data) {
        const [result] = await this.db.insert(schema_1.stockItems).values({
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
            .where((0, drizzle_orm_1.eq)(schema_1.stockItems.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.stockItems).where((0, drizzle_orm_1.eq)(schema_1.stockItems.id, id));
    }
    async updateQuantity(id, quantityDelta, reservedDelta = 0) {
        // Get current values
        const current = await this.db.query.stockItems.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.stockItems.id, id)
        });
        if (!current)
            throw new Error('Stock item not found');
        const [result] = await this.db.update(schema_1.stockItems)
            .set({
            quantity: current.quantity + quantityDelta,
            reservedQty: current.reservedQty + reservedDelta,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.stockItems.id, id))
            .returning();
        return result;
    }
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
        const conditions = [];
        if (filter?.stockItemId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockMovements.stockItemId, filter.stockItemId));
        if (filter?.movementType)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.stockMovements.movementType, filter.movementType));
        if (filter?.startDate)
            conditions.push((0, drizzle_orm_1.gte)(schema_1.stockMovements.createdAt, filter.startDate));
        if (filter?.endDate)
            conditions.push((0, drizzle_orm_1.lte)(schema_1.stockMovements.createdAt, filter.endDate));
        return this.db.select().from(schema_1.stockMovements)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.stockMovements.createdAt))
            .limit(100);
    }
}
exports.StockRepository = StockRepository;
//# sourceMappingURL=stock.repository.js.map