/**
 * Drizzle ORM - Order Tables
 * Order, OrderItem
 */

import { pgTable, uuid, text, integer, real, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderStatusEnum, geometryTypeEnum } from './enums';
import { customers } from './customer';
import { users } from './auth';
import { tenants } from './tenant';

// ==================== ORDER ====================

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),  // Nullable for backward compatibility
    orderNumber: text('order_number').unique().notNull(),
    customerId: uuid('customer_id').references(() => customers.id),
    createdById: uuid('created_by_id').notNull().references(() => users.id),
    status: orderStatusEnum('status').default('DRAFT').notNull(),
    priority: integer('priority').default(5).notNull(),
    dueDate: timestamp('due_date'),
    notes: text('notes'),
    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
    customer: one(customers, {
        fields: [orders.customerId],
        references: [customers.id],
    }),
    createdBy: one(users, {
        fields: [orders.createdById],
        references: [users.id],
    }),
    items: many(orderItems),
}));

// ==================== ORDER ITEM ====================

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    itemCode: text('item_code'),
    itemName: text('item_name'),
    geometryType: geometryTypeEnum('geometry_type').notNull(),

    // 1D dimensions
    length: real('length'),

    // 2D dimensions
    width: real('width'),
    height: real('height'),
    diameter: real('diameter'),
    polygonData: jsonb('polygon_data'),

    // Material
    materialTypeId: uuid('material_type_id').notNull(),
    thickness: real('thickness').notNull(),

    // Quantity
    quantity: integer('quantity').notNull(),
    producedQty: integer('produced_qty').default(0).notNull(),

    // Constraints
    canRotate: boolean('can_rotate').default(true).notNull(),
    grainDirection: text('grain_direction'),

    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
}));
