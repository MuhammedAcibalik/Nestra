/**
 * Drizzle ORM - Stock Tables
 * StockItem, StockMovement
 */

import { pgTable, uuid, text, real, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { stockTypeEnum, movementTypeEnum } from './enums';
import { materialTypes, thicknessRanges } from './material';
import { locations } from './location';
import { tenants } from './tenant';

// ==================== STOCK ITEM ====================

export const stockItems = pgTable('stock_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id), // Nullable for backward compatibility
    code: text('code').unique().notNull(),
    name: text('name').notNull(),
    materialTypeId: uuid('material_type_id')
        .notNull()
        .references(() => materialTypes.id),
    thicknessRangeId: uuid('thickness_range_id').references(() => thicknessRanges.id),
    thickness: real('thickness').notNull(),
    stockType: stockTypeEnum('stock_type').notNull(),

    // 1D dimensions
    length: real('length'),

    // 2D dimensions
    width: real('width'),
    height: real('height'),

    // Inventory
    quantity: integer('quantity').default(0).notNull(),
    reservedQty: integer('reserved_qty').default(0).notNull(),
    unitPrice: real('unit_price'),
    currencyId: text('currency_id'),

    // Location
    locationId: uuid('location_id').references(() => locations.id),

    // Flags
    isFromWaste: boolean('is_from_waste').default(false).notNull(),
    parentStockId: text('parent_stock_id'),

    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const stockItemsRelations = relations(stockItems, ({ one, many }) => ({
    materialType: one(materialTypes, {
        fields: [stockItems.materialTypeId],
        references: [materialTypes.id]
    }),
    thicknessRange: one(thicknessRanges, {
        fields: [stockItems.thicknessRangeId],
        references: [thicknessRanges.id]
    }),
    location: one(locations, {
        fields: [stockItems.locationId],
        references: [locations.id]
    }),
    stockMovements: many(stockMovements)
}));

// ==================== STOCK MOVEMENT ====================

export const stockMovements = pgTable('stock_movements', {
    id: uuid('id').primaryKey().defaultRandom(),
    stockItemId: uuid('stock_item_id')
        .notNull()
        .references(() => stockItems.id),
    movementType: movementTypeEnum('movement_type').notNull(),
    quantity: integer('quantity').notNull(),
    productionLogId: uuid('production_log_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull()
});

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
    stockItem: one(stockItems, {
        fields: [stockMovements.stockItemId],
        references: [stockItems.id]
    })
}));
