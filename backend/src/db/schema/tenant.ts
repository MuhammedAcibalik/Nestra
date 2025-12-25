/**
 * Drizzle ORM - Tenant Table
 * Multi-tenant infrastructure for organization isolation
 */

import { pgTable, uuid, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==================== TENANT ====================

export interface ITenantSettings {
    readonly defaultLanguage?: string;
    readonly timezone?: string;
    readonly dateFormat?: string;
    readonly currency?: string;
    readonly measurementUnit?: 'metric' | 'imperial';
    readonly logoUrl?: string;
    readonly primaryColor?: string;
}

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),  // URL-safe identifier (e.g., 'acme-corp')
    settings: jsonb('settings').$type<ITenantSettings>(),
    isActive: boolean('is_active').default(true).notNull(),
    plan: text('plan').default('basic').notNull(),  // basic, pro, enterprise
    maxUsers: integer('max_users').default(10).notNull(),
    maxLocations: integer('max_locations').default(5).notNull(),
    maxMachines: integer('max_machines').default(10).notNull(),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    address: text('address'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Forward declaration for relations (will be connected in auth.ts)
export const tenantsRelations = relations(tenants, ({ many }) => ({
    users: many(tenantUsers),
}));

// ==================== TENANT USER (Join Table) ====================
// Allows users to belong to multiple tenants with different roles

export const tenantUsers = pgTable('tenant_users', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),  // References users.id (circular ref handled separately)
    isOwner: boolean('is_owner').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
    tenant: one(tenants, {
        fields: [tenantUsers.tenantId],
        references: [tenants.id],
    }),
}));

// ==================== TYPE EXPORTS ====================

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
