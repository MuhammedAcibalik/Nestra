/**
 * Drizzle ORM - Auth Tables
 * User, Role
 */

import { pgTable, uuid, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== ROLE ====================

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').unique().notNull(),
    displayName: text('display_name').notNull(),
    permissions: jsonb('permissions').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const rolesRelations = relations(roles, ({ many }) => ({
    users: many(users)
}));

// ==================== USER ====================

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique().notNull(),
    password: text('password').notNull(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    roleId: uuid('role_id')
        .notNull()
        .references(() => roles.id),
    isActive: boolean('is_active').default(true).notNull(),
    languageId: text('language_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const usersRelations = relations(users, ({ one }) => ({
    role: one(roles, {
        fields: [users.roleId],
        references: [roles.id]
    })
}));
