"use strict";
/**
 * Domain Events Schema
 * Event sourcing lite - persist all domain events for replay and audit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainEvents = exports.eventStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const tenant_1 = require("./tenant");
// ==================== ENUMS ====================
exports.eventStatusEnum = (0, pg_core_1.pgEnum)('event_status', ['pending', 'processed', 'failed', 'dead_letter']);
// ==================== DOMAIN EVENTS TABLE ====================
exports.domainEvents = (0, pg_core_1.pgTable)('domain_events', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    // Event identification
    eventId: (0, pg_core_1.uuid)('event_id').notNull().unique(),
    eventType: (0, pg_core_1.varchar)('event_type', { length: 100 }).notNull(),
    // Aggregate information
    aggregateType: (0, pg_core_1.varchar)('aggregate_type', { length: 100 }).notNull(),
    aggregateId: (0, pg_core_1.uuid)('aggregate_id').notNull(),
    // Event data
    payload: (0, pg_core_1.jsonb)('payload').notNull(),
    metadata: (0, pg_core_1.jsonb)('metadata'),
    // Correlation for distributed tracing
    correlationId: (0, pg_core_1.uuid)('correlation_id'),
    causationId: (0, pg_core_1.uuid)('causation_id'),
    // Processing status
    status: (0, exports.eventStatusEnum)('status').default('pending').notNull(),
    processedAt: (0, pg_core_1.timestamp)('processed_at', { withTimezone: true }),
    error: (0, pg_core_1.varchar)('error', { length: 1000 }),
    retryCount: (0, pg_core_1.varchar)('retry_count', { length: 10 }).default('0'),
    // Multi-tenancy
    tenantId: (0, pg_core_1.uuid)('tenant_id').references(() => tenant_1.tenants.id),
    // Timestamps
    occurredAt: (0, pg_core_1.timestamp)('occurred_at', { withTimezone: true }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
    (0, pg_core_1.index)('idx_domain_events_event_type').on(table.eventType),
    (0, pg_core_1.index)('idx_domain_events_aggregate').on(table.aggregateType, table.aggregateId),
    (0, pg_core_1.index)('idx_domain_events_status').on(table.status),
    (0, pg_core_1.index)('idx_domain_events_occurred_at').on(table.occurredAt),
    (0, pg_core_1.index)('idx_domain_events_correlation').on(table.correlationId),
    (0, pg_core_1.index)('idx_domain_events_tenant').on(table.tenantId)
]);
//# sourceMappingURL=domain_events.js.map