"use strict";
/**
 * Drizzle ORM - Configuration Tables
 * MeasurementUnit, Currency, Language
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.languages = exports.currencies = exports.measurementUnits = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// ==================== MEASUREMENT UNIT ====================
exports.measurementUnits = (0, pg_core_1.pgTable)('measurement_units', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    symbol: (0, pg_core_1.text)('symbol').notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // 'length' | 'area'
    conversionToBase: (0, pg_core_1.real)('conversion_to_base').notNull(),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
}, (table) => [(0, pg_core_1.unique)('measurement_unit_symbol_type').on(table.symbol, table.type)]);
// ==================== CURRENCY ====================
exports.currencies = (0, pg_core_1.pgTable)('currencies', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    code: (0, pg_core_1.text)('code').unique().notNull(),
    symbol: (0, pg_core_1.text)('symbol').notNull(),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
});
// ==================== LANGUAGE ====================
exports.languages = (0, pg_core_1.pgTable)('languages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    code: (0, pg_core_1.text)('code').unique().notNull(),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
});
//# sourceMappingURL=config.js.map