/**
 * Drizzle ORM - Settings Tables
 * WastePolicy, CustomFieldDefinition, Translation
 */

import { pgTable, uuid, text, real, boolean, integer, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';

// ==================== WASTE POLICY ====================

export const wastePolicies = pgTable('waste_policies', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    materialTypeId: uuid('material_type_id'),
    min1DUsableLength: real('min_1d_usable_length').default(200).notNull(),
    min2DUsableArea: real('min_2d_usable_area').default(10000).notNull(),
    min2DWidth: real('min_2d_width').default(100).notNull(),
    min2DHeight: real('min_2d_height').default(100).notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==================== CUSTOM FIELD DEFINITION ====================

export const customFieldDefinitions = pgTable('custom_field_definitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: text('entity_type').notNull(),
    fieldName: text('field_name').notNull(),
    displayName: text('display_name').notNull(),
    fieldType: text('field_type').notNull(),
    options: jsonb('options'),
    isRequired: boolean('is_required').default(false).notNull(),
    defaultValue: text('default_value'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('custom_field_entity_name').on(table.entityType, table.fieldName)
]);

// ==================== TRANSLATION ====================

export const translations = pgTable('translations', {
    id: uuid('id').primaryKey().defaultRandom(),
    languageCode: text('language_code').notNull(),
    key: text('key').notNull(),
    value: text('value').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    unique('translation_lang_key').on(table.languageCode, table.key)
]);
