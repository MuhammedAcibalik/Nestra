"use strict";
/**
 * Drizzle ORM - Material Tables
 * MaterialType, ThicknessRange
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.thicknessRangesRelations = exports.thicknessRanges = exports.materialTypesRelations = exports.materialTypes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== MATERIAL TYPE ====================
exports.materialTypes = (0, pg_core_1.pgTable)('material_types', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').unique().notNull(),
    description: (0, pg_core_1.text)('description'),
    isRotatable: (0, pg_core_1.boolean)('is_rotatable').default(true).notNull(),
    defaultDensity: (0, pg_core_1.real)('default_density'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.materialTypesRelations = (0, drizzle_orm_1.relations)(exports.materialTypes, ({ many }) => ({
    thicknessRanges: many(exports.thicknessRanges),
}));
// ==================== THICKNESS RANGE ====================
exports.thicknessRanges = (0, pg_core_1.pgTable)('thickness_ranges', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    materialTypeId: (0, pg_core_1.uuid)('material_type_id').notNull().references(() => exports.materialTypes.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.text)('name').notNull(),
    minThickness: (0, pg_core_1.real)('min_thickness').notNull(),
    maxThickness: (0, pg_core_1.real)('max_thickness').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('thickness_range_material_name').on(table.materialTypeId, table.name)
]);
exports.thicknessRangesRelations = (0, drizzle_orm_1.relations)(exports.thicknessRanges, ({ one }) => ({
    materialType: one(exports.materialTypes, {
        fields: [exports.thicknessRanges.materialTypeId],
        references: [exports.materialTypes.id],
    }),
}));
//# sourceMappingURL=material.js.map