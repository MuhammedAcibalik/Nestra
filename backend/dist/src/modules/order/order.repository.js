"use strict";
/**
 * Order Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class OrderRepository {
    db;
    orderCounter = 1;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.id, id),
            with: {
                items: true,
                customer: true,
                createdBy: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const conditions = [];
        if (filter?.status)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.status, filter.status));
        if (filter?.customerId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.orders.customerId, filter.customerId));
        return this.db.query.orders.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            with: {
                items: true,
                customer: true,
                createdBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.orders.createdAt)]
        });
    }
    async findByOrderNumber(orderNumber) {
        const result = await this.db.query.orders.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.orders.orderNumber, orderNumber)
        });
        return result ?? null;
    }
    async create(data, userId) {
        // Generate order number if not provided
        const orderNumber = `ORD-${Date.now()}-${this.orderCounter++}`;
        const [result] = await this.db.insert(schema_1.orders).values({
            orderNumber,
            customerId: data.customerId,
            createdById: userId,
            priority: data.priority ?? 5,
            dueDate: data.dueDate,
            notes: data.notes
        }).returning();
        return result;
    }
    async update(id, data) {
        const [result] = await this.db.update(schema_1.orders)
            .set({
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            notes: data.notes,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))
            .returning();
        return result;
    }
    async updateStatus(id, status) {
        const [result] = await this.db.update(schema_1.orders)
            .set({
            status: status,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.orders.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.orders).where((0, drizzle_orm_1.eq)(schema_1.orders.id, id));
    }
    async addItem(orderId, data) {
        const [result] = await this.db.insert(schema_1.orderItems).values({
            orderId: orderId,
            itemCode: data.itemCode,
            itemName: data.itemName,
            geometryType: data.geometryType,
            length: data.length,
            width: data.width,
            height: data.height,
            diameter: data.diameter,
            materialTypeId: data.materialTypeId,
            thickness: data.thickness,
            quantity: data.quantity,
            canRotate: data.canRotate ?? true
        }).returning();
        return result;
    }
}
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=order.repository.js.map