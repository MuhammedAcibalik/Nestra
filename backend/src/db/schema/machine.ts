/**
 * Drizzle ORM - Machine Tables
 * Machine, MachineCompatibility
 */

import { pgTable, uuid, text, real, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { machineTypeEnum } from './enums';
import { locations } from './location';
import { materialTypes, thicknessRanges } from './material';

// ==================== MACHINE ====================

export const machines = pgTable('machines', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    machineType: machineTypeEnum('machine_type').notNull(),

    // Capabilities
    maxLength: real('max_length'),
    maxWidth: real('max_width'),
    maxHeight: real('max_height'),
    minCutLength: real('min_cut_length'),
    kerf: real('kerf'),

    onlyGuillotine: boolean('only_guillotine').default(false).notNull(),
    locationId: uuid('location_id').references(() => locations.id),
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const machinesRelations = relations(machines, ({ one, many }) => ({
    location: one(locations, {
        fields: [machines.locationId],
        references: [locations.id]
    }),
    compatibilities: many(machineCompatibilities)
}));

// ==================== MACHINE COMPATIBILITY ====================

export const machineCompatibilities = pgTable(
    'machine_compatibilities',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        machineId: uuid('machine_id')
            .notNull()
            .references(() => machines.id, { onDelete: 'cascade' }),
        materialTypeId: uuid('material_type_id')
            .notNull()
            .references(() => materialTypes.id, { onDelete: 'cascade' }),
        thicknessRangeId: uuid('thickness_range_id').references(() => thicknessRanges.id, { onDelete: 'cascade' }),
        cuttingSpeed: real('cutting_speed'),
        costPerUnit: real('cost_per_unit'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull()
    },
    (table) => [unique('machine_compat_unique').on(table.machineId, table.materialTypeId, table.thicknessRangeId)]
);

export const machineCompatibilitiesRelations = relations(machineCompatibilities, ({ one }) => ({
    machine: one(machines, {
        fields: [machineCompatibilities.machineId],
        references: [machines.id]
    }),
    materialType: one(materialTypes, {
        fields: [machineCompatibilities.materialTypeId],
        references: [materialTypes.id]
    }),
    thicknessRange: one(thicknessRanges, {
        fields: [machineCompatibilities.thicknessRangeId],
        references: [thicknessRanges.id]
    })
}));
