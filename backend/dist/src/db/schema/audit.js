"use strict";
/**
 * Audit Logs Schema
 * Detailed change tracking for all entities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRelations = exports.auditLogs = exports.AuditAction = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("./auth");
const tenant_1 = require("./tenant");
// ==================== AUDIT LOG ACTIONS ====================
exports.AuditAction = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ: 'READ',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT'
};
// ==================== AUDIT LOGS TABLE ====================
exports.auditLogs = (0, pg_core_1.pgTable)('audit_logs', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').notNull().references(() => tenant_1.tenants.id),
    // Who
    userId: (0, pg_core_1.uuid)('user_id').notNull().references(() => auth_1.users.id),
    userEmail: (0, pg_core_1.varchar)('user_email', { length: 255 }),
    userRole: (0, pg_core_1.varchar)('user_role', { length: 50 }),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    userAgent: (0, pg_core_1.text)('user_agent'),
    // What
    action: (0, pg_core_1.varchar)('action', { length: 100 }).notNull(),
    entityType: (0, pg_core_1.varchar)('entity_type', { length: 100 }).notNull(),
    entityId: (0, pg_core_1.uuid)('entity_id').notNull(),
    entityName: (0, pg_core_1.varchar)('entity_name', { length: 255 }),
    // Changes
    previousValue: (0, pg_core_1.jsonb)('previous_value'),
    newValue: (0, pg_core_1.jsonb)('new_value'),
    changedFields: (0, pg_core_1.text)('changed_fields').array(),
    // Context
    requestId: (0, pg_core_1.uuid)('request_id'),
    sessionId: (0, pg_core_1.uuid)('session_id'),
    module: (0, pg_core_1.varchar)('module', { length: 100 }),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    (0, pg_core_1.index)('idx_audit_tenant_created').on(table.tenantId, table.createdAt),
    (0, pg_core_1.index)('idx_audit_entity').on(table.entityType, table.entityId),
    (0, pg_core_1.index)('idx_audit_user').on(table.userId, table.createdAt),
    (0, pg_core_1.index)('idx_audit_action').on(table.action, table.createdAt)
]);
// ==================== RELATIONS ====================
exports.auditLogsRelations = (0, drizzle_orm_1.relations)(exports.auditLogs, ({ one }) => ({
    user: one(auth_1.users, {
        fields: [exports.auditLogs.userId],
        references: [auth_1.users.id]
    }),
    tenant: one(tenant_1.tenants, {
        fields: [exports.auditLogs.tenantId],
        references: [tenant_1.tenants.id]
    })
}));
//# sourceMappingURL=audit.js.map