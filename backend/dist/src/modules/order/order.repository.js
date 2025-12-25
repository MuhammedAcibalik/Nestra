"use strict";
/**
 * Order Repository
 * Migrated to Drizzle ORM with Tenant Filtering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../../core/database");
const tenant_1 = require("../../core/tenant");
class OrderRepository {
    db;
    orderCounter = 1;
    constructor(db) {
        this.db = db;
    }
    // ==================== TENANT FILTERING ====================
    /**
     * Get tenant filter condition if in tenant context
     */
    getTenantFilter() {
        const tenantId = (0, tenant_1.getCurrentTenantIdOptional)();
        if (!tenantId)
            return undefined;
        return (0, drizzle_orm_1.eq)(schema_1.orders.tenantId, tenantId);
    }
    /**
     * Combine tenant filter with additional conditions
     */
    withTenantFilter(conditions) {
        const tenantFilter = this.getTenantFilter();
        if (tenantFilter)
            conditions.push(tenantFilter);
        return conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined;
    }
    /**
     * Get current tenant ID for create operations
     */
    getCurrentTenantId() {
        return (0, tenant_1.getCurrentTenantIdOptional)();
    }
    // ==================== READ OPERATIONS ====================
    async findById(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.orders.id, id)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.orders.findFirst({
            where,
            with: {
                items: true,
                customer: true,
                createdBy: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const where = (0, database_1.createFilter)()
            .eq(schema_1.orders.status, filter?.status)
            .eq(schema_1.orders.customerId, filter?.customerId)
            .eq(schema_1.orders.tenantId, this.getCurrentTenantId())
            .build();
        return this.db.query.orders.findMany({
            where,
            with: {
                items: true,
                customer: true,
                createdBy: true
            },
            orderBy: [(0, drizzle_orm_1.desc)(schema_1.orders.createdAt)]
        });
    }
    async findByOrderNumber(orderNumber) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.orders.orderNumber, orderNumber)];
        const where = this.withTenantFilter(conditions);
        const result = await this.db.query.orders.findFirst({
            where
        });
        return result ?? null;
    }
    // ==================== WRITE OPERATIONS ====================
    async create(data, userId) {
        // Generate order number if not provided
        const orderNumber = `ORD-${Date.now()}-${this.orderCounter++}`;
        const [result] = await this.db.insert(schema_1.orders).values({
            orderNumber,
            tenantId: this.getCurrentTenantId(), // Auto-inject tenant ID
            customerId: data.customerId,
            createdById: userId,
            priority: data.priority ?? 5,
            dueDate: data.dueDate,
            notes: data.notes
        }).returning();
        return result;
    }
    async update(id, data) {
        // Verify ownership via tenant filter
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.orders.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db.update(schema_1.orders)
            .set({
            status: data.status,
            priority: data.priority,
            dueDate: data.dueDate,
            notes: data.notes,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.orders.id, id))
            .returning();
        return result;
    }
    async updateStatus(id, status) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.orders.id, id)];
        const where = this.withTenantFilter(conditions);
        const [result] = await this.db.update(schema_1.orders)
            .set({
            status: status,
            updatedAt: new Date()
        })
            .where(where ?? (0, drizzle_orm_1.eq)(schema_1.orders.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.orders.id, id)];
        const where = this.withTenantFilter(conditions);
        await this.db.delete(schema_1.orders).where(where ?? (0, drizzle_orm_1.eq)(schema_1.orders.id, id));
    }
    // ==================== ORDER ITEMS ====================
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