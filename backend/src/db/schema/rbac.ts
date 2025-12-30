/**
 * Drizzle ORM - RBAC Tables
 * Role-Based Access Control with granular permissions
 */

import { pgTable, uuid, text, timestamp, unique, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roles } from './auth';
import { tenants } from './tenant';

// ==================== ENUMS ====================

export const permissionCategoryEnum = pgEnum('permission_category', [
    'orders',
    'stock',
    'production',
    'optimization',
    'reports',
    'users',
    'settings',
    'suppliers',
    'machines',
    'customers',
    'analytics',
    'admin'
]);

export const permissionActionEnum = pgEnum('permission_action', [
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'export',
    'import',
    'manage'
]);

// ==================== PERMISSIONS ====================

export const permissions = pgTable('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').unique().notNull(), // e.g., 'orders:create', 'stock:read'
    name: text('name').notNull(),
    description: text('description'),
    category: permissionCategoryEnum('category').notNull(),
    action: permissionActionEnum('action').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const permissionsRelations = relations(permissions, ({ many }) => ({
    rolePermissions: many(rolePermissions)
}));

// ==================== ROLE PERMISSIONS (MANY-TO-MANY) ====================

export const rolePermissions = pgTable(
    'role_permissions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        roleId: uuid('role_id')
            .notNull()
            .references(() => roles.id, { onDelete: 'cascade' }),
        permissionId: uuid('permission_id')
            .notNull()
            .references(() => permissions.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull()
    },
    (table) => [unique('role_permission_unique').on(table.roleId, table.permissionId)]
);

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
    role: one(roles, {
        fields: [rolePermissions.roleId],
        references: [roles.id]
    }),
    permission: one(permissions, {
        fields: [rolePermissions.permissionId],
        references: [permissions.id]
    })
}));

// ==================== TENANT ROLES (CUSTOM ROLES PER TENANT) ====================

export const tenantRoles = pgTable(
    'tenant_roles',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        displayName: text('display_name').notNull(),
        description: text('description'),
        isSystem: text('is_system').default('false'), // System roles can't be deleted
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull()
    },
    (table) => [unique('tenant_role_name').on(table.tenantId, table.name)]
);

export const tenantRolesRelations = relations(tenantRoles, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [tenantRoles.tenantId],
        references: [tenants.id]
    }),
    permissions: many(tenantRolePermissions)
}));

// ==================== TENANT ROLE PERMISSIONS ====================

export const tenantRolePermissions = pgTable(
    'tenant_role_permissions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantRoleId: uuid('tenant_role_id')
            .notNull()
            .references(() => tenantRoles.id, { onDelete: 'cascade' }),
        permissionId: uuid('permission_id')
            .notNull()
            .references(() => permissions.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').defaultNow().notNull()
    },
    (table) => [unique('tenant_role_permission_unique').on(table.tenantRoleId, table.permissionId)]
);

export const tenantRolePermissionsRelations = relations(tenantRolePermissions, ({ one }) => ({
    tenantRole: one(tenantRoles, {
        fields: [tenantRolePermissions.tenantRoleId],
        references: [tenantRoles.id]
    }),
    permission: one(permissions, {
        fields: [tenantRolePermissions.permissionId],
        references: [permissions.id]
    })
}));

// ==================== TYPE EXPORTS ====================

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type PermissionCategory = (typeof permissionCategoryEnum.enumValues)[number];
export type PermissionAction = (typeof permissionActionEnum.enumValues)[number];

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

export type TenantRole = typeof tenantRoles.$inferSelect;
export type NewTenantRole = typeof tenantRoles.$inferInsert;

export type TenantRolePermission = typeof tenantRolePermissions.$inferSelect;
export type NewTenantRolePermission = typeof tenantRolePermissions.$inferInsert;
