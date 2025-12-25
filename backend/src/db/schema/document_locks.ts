/**
 * Drizzle ORM - Document Locks Table
 * Pessimistic locking for real-time collaboration
 */

import { pgTable, uuid, text, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { tenants } from './tenant';
import { users } from './auth';

// ==================== DOCUMENT TYPES ====================

export type LockableDocumentType = 'cutting_plan' | 'optimization_scenario' | 'order' | 'cutting_job' | 'stock_item';

export interface ILockMetadata {
    readonly clientId?: string;
    readonly browserInfo?: string;
    readonly reason?: string;
    readonly [key: string]: unknown;
}

// ==================== DOCUMENT LOCKS ====================

export const documentLocks = pgTable(
    'document_locks',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id')
            .notNull()
            .references(() => tenants.id, { onDelete: 'cascade' }),
        documentType: text('document_type').$type<LockableDocumentType>().notNull(),
        documentId: uuid('document_id').notNull(),
        lockedById: uuid('locked_by_id')
            .notNull()
            .references(() => users.id),
        lockedAt: timestamp('locked_at').defaultNow().notNull(),
        expiresAt: timestamp('expires_at').notNull(), // Auto-release after timeout
        lastHeartbeat: timestamp('last_heartbeat').defaultNow().notNull(),
        metadata: jsonb('metadata').$type<ILockMetadata>()
    },
    (table) => [
        // Ensure only one lock per document per tenant
        unique('document_lock_unique').on(table.tenantId, table.documentType, table.documentId)
    ]
);

export const documentLocksRelations = relations(documentLocks, ({ one }) => ({
    tenant: one(tenants, {
        fields: [documentLocks.tenantId],
        references: [tenants.id]
    }),
    lockedBy: one(users, {
        fields: [documentLocks.lockedById],
        references: [users.id]
    })
}));

// ==================== TYPE EXPORTS ====================

export type DocumentLock = typeof documentLocks.$inferSelect;
export type NewDocumentLock = typeof documentLocks.$inferInsert;
