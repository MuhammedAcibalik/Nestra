"use strict";
/**
 * Drizzle ORM - Stock Tables
 * StockItem, StockMovement
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockMovementsRelations = exports.stockMovements = exports.stockItemsRelations = exports.stockItems = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const material_1 = require("./material");
const location_1 = require("./location");
const tenant_1 = require("./tenant");
// ==================== STOCK ITEM ====================
exports.stockItems = (0, pg_core_1.pgTable)('stock_items', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => tenant_1.tenants.id), // Nullable for backward compatibility
    code: (0, pg_core_1.text)('code').unique().notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    materialTypeId: (0, pg_core_1.uuid)('material_type_id')
        .notNull()
        .references(() => material_1.materialTypes.id),
    thicknessRangeId: (0, pg_core_1.uuid)('thickness_range_id').references(() => material_1.thicknessRanges.id),
    thickness: (0, pg_core_1.real)('thickness').notNull(),
    stockType: (0, enums_1.stockTypeEnum)('stock_type').notNull(),
    // 1D dimensions
    length: (0, pg_core_1.real)('length'),
    // 2D dimensions
    width: (0, pg_core_1.real)('width'),
    height: (0, pg_core_1.real)('height'),
    // Inventory
    quantity: (0, pg_core_1.integer)('quantity').default(0).notNull(),
    reservedQty: (0, pg_core_1.integer)('reserved_qty').default(0).notNull(),
    unitPrice: (0, pg_core_1.real)('unit_price'),
    currencyId: (0, pg_core_1.text)('currency_id'),
    // Location
    locationId: (0, pg_core_1.uuid)('location_id').references(() => location_1.locations.id),
    // Flags
    isFromWaste: (0, pg_core_1.boolean)('is_from_waste').default(false).notNull(),
    parentStockId: (0, pg_core_1.text)('parent_stock_id'),
    customFields: (0, pg_core_1.jsonb)('custom_fields'),
    // Optimistic Locking
    version: (0, pg_core_1.integer)('version').default(1).notNull(),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    // Soft Delete
    deletedAt: (0, pg_core_1.timestamp)('deleted_at')
});
exports.stockItemsRelations = (0, drizzle_orm_1.relations)(exports.stockItems, ({ one, many }) => ({
    materialType: one(material_1.materialTypes, {
        fields: [exports.stockItems.materialTypeId],
        references: [material_1.materialTypes.id]
    }),
    thicknessRange: one(material_1.thicknessRanges, {
        fields: [exports.stockItems.thicknessRangeId],
        references: [material_1.thicknessRanges.id]
    }),
    location: one(location_1.locations, {
        fields: [exports.stockItems.locationId],
        references: [location_1.locations.id]
    }),
    stockMovements: many(exports.stockMovements)
}));
// ==================== STOCK MOVEMENT ====================
exports.stockMovements = (0, pg_core_1.pgTable)('stock_movements', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    stockItemId: (0, pg_core_1.uuid)('stock_item_id')
        .notNull()
        .references(() => exports.stockItems.id),
    movementType: (0, enums_1.movementTypeEnum)('movement_type').notNull(),
    quantity: (0, pg_core_1.integer)('quantity').notNull(),
    productionLogId: (0, pg_core_1.uuid)('production_log_id'),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull()
});
exports.stockMovementsRelations = (0, drizzle_orm_1.relations)(exports.stockMovements, ({ one }) => ({
    stockItem: one(exports.stockItems, {
        fields: [exports.stockMovements.stockItemId],
        references: [exports.stockItems.id]
    })
}));
//# sourceMappingURL=stock.js.map