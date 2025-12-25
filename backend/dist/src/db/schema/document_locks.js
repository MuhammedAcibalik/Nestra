"use strict";
/**
 * Drizzle ORM - Document Locks Table
 * Pessimistic locking for real-time collaboration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentLocksRelations = exports.documentLocks = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const tenant_1 = require("./tenant");
const auth_1 = require("./auth");
// ==================== DOCUMENT LOCKS ====================
exports.documentLocks = (0, pg_core_1.pgTable)('document_locks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    tenantId: (0, pg_core_1.uuid)('tenant_id').notNull().references(() => tenant_1.tenants.id, { onDelete: 'cascade' }),
    documentType: (0, pg_core_1.text)('document_type').$type().notNull(),
    documentId: (0, pg_core_1.uuid)('document_id').notNull(),
    lockedById: (0, pg_core_1.uuid)('locked_by_id').notNull().references(() => auth_1.users.id),
    lockedAt: (0, pg_core_1.timestamp)('locked_at').defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(), // Auto-release after timeout
    lastHeartbeat: (0, pg_core_1.timestamp)('last_heartbeat').defaultNow().notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata').$type(),
}, (table) => [
    // Ensure only one lock per document per tenant
    (0, pg_core_1.unique)('document_lock_unique').on(table.tenantId, table.documentType, table.documentId)
]);
exports.documentLocksRelations = (0, drizzle_orm_1.relations)(exports.documentLocks, ({ one }) => ({
    tenant: one(tenant_1.tenants, {
        fields: [exports.documentLocks.tenantId],
        references: [tenant_1.tenants.id],
    }),
    lockedBy: one(auth_1.users, {
        fields: [exports.documentLocks.lockedById],
        references: [auth_1.users.id],
    }),
}));
//# sourceMappingURL=document_locks.js.map