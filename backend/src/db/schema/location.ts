/**
 * Drizzle ORM - Location Table
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const locations = pgTable('locations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    description: text('description'),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const locationsRelations = relations(locations, ({ many }) => ({
    // Relations will be defined in respective files to avoid circular imports
}));
