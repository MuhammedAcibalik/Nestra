"use strict";
/**
 * Drizzle ORM - Machine Tables
 * Machine, MachineCompatibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineCompatibilitiesRelations = exports.machineCompatibilities = exports.machinesRelations = exports.machines = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const enums_1 = require("./enums");
const location_1 = require("./location");
const material_1 = require("./material");
// ==================== MACHINE ====================
exports.machines = (0, pg_core_1.pgTable)('machines', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    code: (0, pg_core_1.text)('code').unique().notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    description: (0, pg_core_1.text)('description'),
    machineType: (0, enums_1.machineTypeEnum)('machine_type').notNull(),
    // Capabilities
    maxLength: (0, pg_core_1.real)('max_length'),
    maxWidth: (0, pg_core_1.real)('max_width'),
    maxHeight: (0, pg_core_1.real)('max_height'),
    minCutLength: (0, pg_core_1.real)('min_cut_length'),
    kerf: (0, pg_core_1.real)('kerf'),
    onlyGuillotine: (0, pg_core_1.boolean)('only_guillotine').default(false).notNull(),
    locationId: (0, pg_core_1.uuid)('location_id').references(() => location_1.locations.id),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.machinesRelations = (0, drizzle_orm_1.relations)(exports.machines, ({ one, many }) => ({
    location: one(location_1.locations, {
        fields: [exports.machines.locationId],
        references: [location_1.locations.id],
    }),
    compatibilities: many(exports.machineCompatibilities),
}));
// ==================== MACHINE COMPATIBILITY ====================
exports.machineCompatibilities = (0, pg_core_1.pgTable)('machine_compatibilities', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    machineId: (0, pg_core_1.uuid)('machine_id').notNull().references(() => exports.machines.id, { onDelete: 'cascade' }),
    materialTypeId: (0, pg_core_1.uuid)('material_type_id').notNull().references(() => material_1.materialTypes.id, { onDelete: 'cascade' }),
    thicknessRangeId: (0, pg_core_1.uuid)('thickness_range_id').references(() => material_1.thicknessRanges.id, { onDelete: 'cascade' }),
    cuttingSpeed: (0, pg_core_1.real)('cutting_speed'),
    costPerUnit: (0, pg_core_1.real)('cost_per_unit'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('machine_compat_unique').on(table.machineId, table.materialTypeId, table.thicknessRangeId)
]);
exports.machineCompatibilitiesRelations = (0, drizzle_orm_1.relations)(exports.machineCompatibilities, ({ one }) => ({
    machine: one(exports.machines, {
        fields: [exports.machineCompatibilities.machineId],
        references: [exports.machines.id],
    }),
    materialType: one(material_1.materialTypes, {
        fields: [exports.machineCompatibilities.materialTypeId],
        references: [material_1.materialTypes.id],
    }),
    thicknessRange: one(material_1.thicknessRanges, {
        fields: [exports.machineCompatibilities.thicknessRangeId],
        references: [material_1.thicknessRanges.id],
    }),
}));
//# sourceMappingURL=machine.js.map