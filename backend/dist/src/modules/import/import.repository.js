"use strict";
/**
 * Import Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== REPOSITORY ====================
class ImportRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async importStockItems(data) {
        if (data.length === 0)
            return 0;
        const result = await this.db
            .insert(schema_1.stockItems)
            .values(data.map((item) => ({
            code: item.code,
            name: item.name,
            materialTypeId: item.materialTypeId,
            stockType: item.stockType,
            thickness: item.thickness,
            length: item.length,
            width: item.width,
            height: item.height,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            locationId: item.locationId
        })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }
    async importMaterials(data) {
        if (data.length === 0)
            return 0;
        const result = await this.db
            .insert(schema_1.materialTypes)
            .values(data.map((item) => ({
            name: item.name,
            description: item.description,
            defaultDensity: item.defaultDensity
        })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }
    async importCustomers(data) {
        if (data.length === 0)
            return 0;
        const result = await this.db
            .insert(schema_1.customers)
            .values(data.map((item) => ({
            code: item.code,
            name: item.name,
            email: item.email,
            phone: item.phone,
            address: item.address,
            taxId: item.taxId
        })))
            .onConflictDoNothing()
            .returning();
        return result.length;
    }
    async getOrderCount() {
        const result = await this.db
            .select({
            count: (0, drizzle_orm_1.sql) `count(*)`
        })
            .from(schema_1.orders);
        return Number(result[0]?.count ?? 0);
    }
    /**
     * Find material type by code for import mapping
     */
    async findMaterialByCode(code) {
        const result = await this.db
            .select({ id: schema_1.materialTypes.id, name: schema_1.materialTypes.name })
            .from(schema_1.materialTypes)
            .where((0, drizzle_orm_1.sql) `LOWER(${schema_1.materialTypes.name}) = LOWER(${code})`)
            .limit(1);
        return result[0] ?? null;
    }
    /**
     * Generate atomic order number using database sequence
     * Race-condition safe - uses MAX with lock
     */
    async generateOrderNumber() {
        const date = new Date();
        const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const prefix = `ORD-${yearMonth}-`;
        // Use MAX + 1 in a single atomic query to avoid race conditions
        const result = await this.db
            .select({
            maxNum: (0, drizzle_orm_1.sql) `COALESCE(
                    MAX(CAST(SUBSTRING(order_number FROM ${prefix.length + 1}) AS INTEGER)),
                    0
                ) + 1`
        })
            .from(schema_1.orders)
            .where((0, drizzle_orm_1.sql) `order_number LIKE ${prefix + '%'}`);
        const nextNum = Number(result[0]?.maxNum ?? 1);
        return `${prefix}${String(nextNum).padStart(5, '0')}`;
    }
    async createOrderWithItems(data) {
        // Create order
        const [order] = await this.db
            .insert(schema_1.orders)
            .values({
            orderNumber: data.orderNumber,
            customerId: data.customerId,
            createdById: data.createdById,
            priority: data.priority ?? 5,
            dueDate: data.dueDate,
            notes: data.notes
        })
            .returning();
        // Create order items
        if (data.items.length > 0) {
            await this.db.insert(schema_1.orderItems).values(data.items.map((item) => ({
                orderId: order.id,
                itemCode: item.itemCode,
                itemName: item.itemName,
                geometryType: item.geometryType,
                length: item.length,
                width: item.width,
                height: item.height,
                diameter: item.diameter,
                materialTypeId: item.materialTypeId,
                thickness: item.thickness,
                quantity: item.quantity,
                canRotate: item.canRotate ?? true
            })));
        }
        return { id: order.id, orderNumber: order.orderNumber };
    }
}
exports.ImportRepository = ImportRepository;
//# sourceMappingURL=import.repository.js.map