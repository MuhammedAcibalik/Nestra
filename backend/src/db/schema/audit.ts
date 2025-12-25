/**
 * Audit Logs Schema
 * Detailed change tracking for all entities
 */

import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { tenants } from './tenant';

// ==================== AUDIT LOG ACTIONS ====================

export const AuditAction = {
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
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ==================== AUDIT LOGS TABLE ====================

export const auditLogs = pgTable(
    'audit_logs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id),

        // Who
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id),
        userEmail: varchar('user_email', { length: 255 }),
        userRole: varchar('user_role', { length: 50 }),
        ipAddress: varchar('ip_address', { length: 45 }),
        userAgent: text('user_agent'),

        // What
        action: varchar('action', { length: 100 }).notNull(),
        entityType: varchar('entity_type', { length: 100 }).notNull(),
        entityId: uuid('entity_id').notNull(),
        entityName: varchar('entity_name', { length: 255 }),

        // Changes
        previousValue: jsonb('previous_value'),
        newValue: jsonb('new_value'),
        changedFields: text('changed_fields').array(),

        // Context
        requestId: uuid('request_id'),
        sessionId: uuid('session_id'),
        module: varchar('module', { length: 100 }),
        metadata: jsonb('metadata'),

        // Timestamps
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (table) => [
        index('idx_audit_tenant_created').on(table.tenantId, table.createdAt),
        index('idx_audit_entity').on(table.entityType, table.entityId),
        index('idx_audit_user').on(table.userId, table.createdAt),
        index('idx_audit_action').on(table.action, table.createdAt)
    ]
);

// ==================== RELATIONS ====================

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id]
    }),
    tenant: one(tenants, {
        fields: [auditLogs.tenantId],
        references: [tenants.id]
    })
}));

// ==================== TYPE EXPORTS ====================

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
