"use strict";
/**
 * Drizzle ORM - Settings Tables
 * WastePolicy, CustomFieldDefinition, Translation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.translations = exports.customFieldDefinitions = exports.wastePolicies = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ==================== WASTE POLICY ====================
exports.wastePolicies = (0, pg_core_1.pgTable)('waste_policies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    materialTypeId: (0, pg_core_1.uuid)('material_type_id'),
    min1DUsableLength: (0, pg_core_1.real)('min_1d_usable_length').default(200).notNull(),
    min2DUsableArea: (0, pg_core_1.real)('min_2d_usable_area').default(10000).notNull(),
    min2DWidth: (0, pg_core_1.real)('min_2d_width').default(100).notNull(),
    min2DHeight: (0, pg_core_1.real)('min_2d_height').default(100).notNull(),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// ==================== CUSTOM FIELD DEFINITION ====================
exports.customFieldDefinitions = (0, pg_core_1.pgTable)('custom_field_definitions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    entityType: (0, pg_core_1.text)('entity_type').notNull(),
    fieldName: (0, pg_core_1.text)('field_name').notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    fieldType: (0, pg_core_1.text)('field_type').notNull(),
    options: (0, pg_core_1.jsonb)('options'),
    isRequired: (0, pg_core_1.boolean)('is_required').default(false).notNull(),
    defaultValue: (0, pg_core_1.text)('default_value'),
    sortOrder: (0, pg_core_1.integer)('sort_order').default(0).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('custom_field_entity_name').on(table.entityType, table.fieldName)
]);
// ==================== TRANSLATION ====================
exports.translations = (0, pg_core_1.pgTable)('translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    languageCode: (0, pg_core_1.text)('language_code').notNull(),
    key: (0, pg_core_1.text)('key').notNull(),
    value: (0, pg_core_1.text)('value').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)('translation_lang_key').on(table.languageCode, table.key)
]);
//# sourceMappingURL=settings.js.map