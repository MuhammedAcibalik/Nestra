"use strict";
/**
 * Drizzle ORM - Customer Table
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRelations = exports.customers = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.customers = (0, pg_core_1.pgTable)('customers', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    code: (0, pg_core_1.text)('code').unique().notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email'),
    phone: (0, pg_core_1.text)('phone'),
    address: (0, pg_core_1.text)('address'),
    taxId: (0, pg_core_1.text)('tax_id'),
    customFields: (0, pg_core_1.jsonb)('custom_fields'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
exports.customersRelations = (0, drizzle_orm_1.relations)(exports.customers, ({ many }) => ({
// orders relation defined in order.ts
}));
//# sourceMappingURL=customer.js.map