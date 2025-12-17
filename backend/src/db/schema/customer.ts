/**
 * Drizzle ORM - Customer Table
 */

import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const customers = pgTable('customers', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(),
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    taxId: text('tax_id'),
    customFields: jsonb('custom_fields'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const customersRelations = relations(customers, ({ many }) => ({
    // orders relation defined in order.ts
}));
