/**
 * Drizzle ORM - Material Tables
 * MaterialType, ThicknessRange
 */

import { pgTable, uuid, text, real, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== MATERIAL TYPE ====================

export const materialTypes = pgTable('material_types', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    description: text('description'),
    isRotatable: boolean('is_rotatable').default(true).notNull(),
    defaultDensity: real('default_density'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const materialTypesRelations = relations(materialTypes, ({ many }) => ({
    thicknessRanges: many(thicknessRanges),
}));

// ==================== THICKNESS RANGE ====================

export const thicknessRanges = pgTable('thickness_ranges', {
    id: uuid('id').primaryKey().defaultRandom(),
    materialTypeId: uuid('material_type_id').notNull().references(() => materialTypes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    minThickness: real('min_thickness').notNull(),
    maxThickness: real('max_thickness').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('thickness_range_material_name').on(table.materialTypeId, table.name)
]);

export const thicknessRangesRelations = relations(thicknessRanges, ({ one }) => ({
    materialType: one(materialTypes, {
        fields: [thicknessRanges.materialTypeId],
        references: [materialTypes.id],
    }),
}));
