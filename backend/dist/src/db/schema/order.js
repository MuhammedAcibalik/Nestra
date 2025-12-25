"use strict";
/**
 * Drizzle ORM - Order Tables
 * Order, OrderItem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderItemsRelations = exports.orderItems = exports.ordersRelations = exports.orders = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const customer_1 = require("./customer");
const auth_1 = require("./auth");
const tenant_1 = require("./tenant");
// ==================== ORDER ====================
exports.orders = (0, pg_core_1.pgTable)('orders', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => tenant_1.tenants.id), // Nullable for backward compatibility
    orderNumber: (0, pg_core_1.text)('order_number').unique().notNull(),
    customerId: (0, pg_core_1.uuid)('customer_id').references(() => customer_1.customers.id),
    createdById: (0, pg_core_1.uuid)('created_by_id').notNull().references(() => auth_1.users.id),
    status: (0, enums_1.orderStatusEnum)('status').default('DRAFT').notNull(),
    priority: (0, pg_core_1.integer)('priority').default(5).notNull(),
    dueDate: (0, pg_core_1.timestamp)('due_date'),
    notes: (0, pg_core_1.text)('notes'),
    customFields: (0, pg_core_1.jsonb)('custom_fields'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    customer: one(customer_1.customers, {
        fields: [exports.orders.customerId],
        references: [customer_1.customers.id],
    }),
    createdBy: one(auth_1.users, {
        fields: [exports.orders.createdById],
        references: [auth_1.users.id],
    }),
    items: many(exports.orderItems),
}));
// ==================== ORDER ITEM ====================
exports.orderItems = (0, pg_core_1.pgTable)('order_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)('order_id').notNull().references(() => exports.orders.id, { onDelete: 'cascade' }),
    itemCode: (0, pg_core_1.text)('item_code'),
    itemName: (0, pg_core_1.text)('item_name'),
    geometryType: (0, enums_1.geometryTypeEnum)('geometry_type').notNull(),
    // 1D dimensions
    length: (0, pg_core_1.real)('length'),
    // 2D dimensions
    width: (0, pg_core_1.real)('width'),
    height: (0, pg_core_1.real)('height'),
    diameter: (0, pg_core_1.real)('diameter'),
    polygonData: (0, pg_core_1.jsonb)('polygon_data'),
    // Material
    materialTypeId: (0, pg_core_1.uuid)('material_type_id').notNull(),
    thickness: (0, pg_core_1.real)('thickness').notNull(),
    // Quantity
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    producedQty: (0, pg_core_1.integer)('produced_qty').default(0).notNull(),
    // Constraints
    canRotate: (0, pg_core_1.boolean)('can_rotate').default(true).notNull(),
    grainDirection: (0, pg_core_1.text)('grain_direction'),
    customFields: (0, pg_core_1.jsonb)('custom_fields'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, ({ one }) => ({
    order: one(exports.orders, {
        fields: [exports.orderItems.orderId],
        references: [exports.orders.id],
    }),
}));
//# sourceMappingURL=order.js.map