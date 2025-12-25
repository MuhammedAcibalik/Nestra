"use strict";
/**
 * Drizzle ORM - Tenant Table
 * Multi-tenant infrastructure for organization isolation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantUsersRelations = exports.tenantUsers = exports.tenantsRelations = exports.tenants = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.tenants = (0, pg_core_1.pgTable)('tenants', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    slug: (0, pg_core_1.text)('slug').unique().notNull(), // URL-safe identifier (e.g., 'acme-corp')
    settings: (0, pg_core_1.jsonb)('settings').$type(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    plan: (0, pg_core_1.text)('plan').default('basic').notNull(), // basic, pro, enterprise
    maxUsers: (0, pg_core_1.integer)('max_users').default(10).notNull(),
    maxLocations: (0, pg_core_1.integer)('max_locations').default(5).notNull(),
    maxMachines: (0, pg_core_1.integer)('max_machines').default(10).notNull(),
    contactEmail: (0, pg_core_1.text)('contact_email'),
    contactPhone: (0, pg_core_1.text)('contact_phone'),
    address: (0, pg_core_1.text)('address'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Forward declaration for relations (will be connected in auth.ts)
exports.tenantsRelations = (0, drizzle_orm_1.relations)(exports.tenants, ({ many }) => ({
    users: many(exports.tenantUsers),
}));
// ==================== TENANT USER (Join Table) ====================
// Allows users to belong to multiple tenants with different roles
exports.tenantUsers = (0, pg_core_1.pgTable)('tenant_users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').notNull().references(() => exports.tenants.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id').notNull(), // References users.id (circular ref handled separately)
    isOwner: (0, pg_core_1.boolean)('is_owner').default(false).notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    joinedAt: (0, pg_core_1.timestamp)('joined_at').defaultNow().notNull(),
});
exports.tenantUsersRelations = (0, drizzle_orm_1.relations)(exports.tenantUsers, ({ one }) => ({
    tenant: one(exports.tenants, {
        fields: [exports.tenantUsers.tenantId],
        references: [exports.tenants.id],
    }),
}));
//# sourceMappingURL=tenant.js.map