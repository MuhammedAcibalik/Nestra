"use strict";
/**
 * Drizzle ORM - Auth Tables
 * User, Role
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRelations = exports.users = exports.rolesRelations = exports.roles = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
// ==================== ROLE ====================
exports.roles = (0, pg_core_1.pgTable)('roles', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').unique().notNull(),
    displayName: (0, pg_core_1.text)('display_name').notNull(),
    permissions: (0, pg_core_1.jsonb)('permissions').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
});
exports.rolesRelations = (0, drizzle_orm_1.relations)(exports.roles, ({ many }) => ({
    users: many(exports.users)
}));
// ==================== USER ====================
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').unique().notNull(),
    password: (0, pg_core_1.text)('password').notNull(),
    firstName: (0, pg_core_1.text)('first_name').notNull(),
    lastName: (0, pg_core_1.text)('last_name').notNull(),
    roleId: (0, pg_core_1.uuid)('role_id')
        .notNull()
        .references(() => exports.roles.id),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    languageId: (0, pg_core_1.text)('language_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull()
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one }) => ({
    role: one(exports.roles, {
        fields: [exports.users.roleId],
        references: [exports.roles.id]
    })
}));
//# sourceMappingURL=auth.js.map