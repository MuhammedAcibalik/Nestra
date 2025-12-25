/**
 * Drizzle ORM - Configuration Tables
 * MeasurementUnit, Currency, Language
 */

import { pgTable, uuid, text, real, boolean, timestamp, unique } from 'drizzle-orm/pg-core';

// ==================== MEASUREMENT UNIT ====================

export const measurementUnits = pgTable(
    'measurement_units',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        name: text('name').notNull(),
        symbol: text('symbol').notNull(),
        type: text('type').notNull(), // 'length' | 'area'
        conversionToBase: real('conversion_to_base').notNull(),
        isDefault: boolean('is_default').default(false).notNull(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull()
    },
    (table) => [unique('measurement_unit_symbol_type').on(table.symbol, table.type)]
);

// ==================== CURRENCY ====================

export const currencies = pgTable('currencies', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    code: text('code').unique().notNull(),
    symbol: text('symbol').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ==================== LANGUAGE ====================

export const languages = pgTable('languages', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    code: text('code').unique().notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});
