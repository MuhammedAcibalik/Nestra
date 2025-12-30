/**
 * Drizzle ORM - Supplier Tables
 * Supplier, PurchaseOrder, PurchaseOrderItem
 */

import { pgTable, uuid, text, integer, real, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenant';
import { users } from './auth';
import { materialTypes } from './material';

// ==================== ENUMS ====================

export const supplierStatusEnum = pgEnum('supplier_status', [
    'active',
    'inactive',
    'suspended',
    'pending'
]);

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
    'draft',
    'pending_approval',
    'approved',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
]);

// ==================== SUPPLIER ====================

export const suppliers = pgTable('suppliers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    code: text('code').unique().notNull(),
    name: text('name').notNull(),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    city: text('city'),
    country: text('country'),
    taxId: text('tax_id'),
    status: supplierStatusEnum('status').default('active').notNull(),
    paymentTerms: integer('payment_terms').default(30), // Days
    currency: text('currency').default('TRY'),
    notes: text('notes'),
    // Optimistic Locking
    version: integer('version').default(1).notNull(),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    // Soft Delete
    deletedAt: timestamp('deleted_at')
});

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [suppliers.tenantId],
        references: [tenants.id]
    }),
    purchaseOrders: many(purchaseOrders)
}));

// ==================== PURCHASE ORDER ====================

export const purchaseOrders = pgTable('purchase_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id),
    poNumber: text('po_number').unique().notNull(),
    supplierId: uuid('supplier_id')
        .notNull()
        .references(() => suppliers.id),
    createdById: uuid('created_by_id')
        .notNull()
        .references(() => users.id),
    approvedById: uuid('approved_by_id').references(() => users.id),
    status: purchaseOrderStatusEnum('status').default('draft').notNull(),
    orderDate: timestamp('order_date').defaultNow().notNull(),
    expectedDeliveryDate: timestamp('expected_delivery_date'),
    actualDeliveryDate: timestamp('actual_delivery_date'),
    totalAmount: real('total_amount').default(0),
    currency: text('currency').default('TRY'),
    paymentTerms: integer('payment_terms'),
    shippingAddress: text('shipping_address'),
    notes: text('notes'),
    // Optimistic Locking
    version: integer('version').default(1).notNull(),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    // Soft Delete
    deletedAt: timestamp('deleted_at')
});

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [purchaseOrders.tenantId],
        references: [tenants.id]
    }),
    supplier: one(suppliers, {
        fields: [purchaseOrders.supplierId],
        references: [suppliers.id]
    }),
    createdBy: one(users, {
        fields: [purchaseOrders.createdById],
        references: [users.id]
    }),
    approvedBy: one(users, {
        fields: [purchaseOrders.approvedById],
        references: [users.id]
    }),
    items: many(purchaseOrderItems)
}));

// ==================== PURCHASE ORDER ITEM ====================

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    purchaseOrderId: uuid('purchase_order_id')
        .notNull()
        .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    materialTypeId: uuid('material_type_id')
        .notNull()
        .references(() => materialTypes.id),
    description: text('description'),
    quantity: integer('quantity').notNull(),
    receivedQuantity: integer('received_quantity').default(0),
    unitPrice: real('unit_price').notNull(),
    totalPrice: real('total_price').notNull(),
    thickness: real('thickness'),
    width: real('width'),
    height: real('height'),
    length: real('length'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
    purchaseOrder: one(purchaseOrders, {
        fields: [purchaseOrderItems.purchaseOrderId],
        references: [purchaseOrders.id]
    }),
    materialType: one(materialTypes, {
        fields: [purchaseOrderItems.materialTypeId],
        references: [materialTypes.id]
    })
}));

// ==================== TYPE EXPORTS ====================

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierStatus = (typeof supplierStatusEnum.enumValues)[number];

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PurchaseOrderStatus = (typeof purchaseOrderStatusEnum.enumValues)[number];

export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type NewPurchaseOrderItem = typeof purchaseOrderItems.$inferInsert;
