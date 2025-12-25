/**
 * Domain Events Schema
 * Event sourcing lite - persist all domain events for replay and audit
 */

import { pgTable, uuid, varchar, jsonb, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenant';

// ==================== ENUMS ====================

export const eventStatusEnum = pgEnum('event_status', ['pending', 'processed', 'failed', 'dead_letter']);

// ==================== DOMAIN EVENTS TABLE ====================

export const domainEvents = pgTable(
    'domain_events',
    {
        id: uuid('id').primaryKey().defaultRandom(),

        // Event identification
        eventId: uuid('event_id').notNull().unique(),
        eventType: varchar('event_type', { length: 100 }).notNull(),

        // Aggregate information
        aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
        aggregateId: uuid('aggregate_id').notNull(),

        // Event data
        payload: jsonb('payload').notNull(),
        metadata: jsonb('metadata'),

        // Correlation for distributed tracing
        correlationId: uuid('correlation_id'),
        causationId: uuid('causation_id'),

        // Processing status
        status: eventStatusEnum('status').default('pending').notNull(),
        processedAt: timestamp('processed_at', { withTimezone: true }),
        error: varchar('error', { length: 1000 }),
        retryCount: varchar('retry_count', { length: 10 }).default('0'),

        // Multi-tenancy
        tenantId: uuid('tenant_id').references(() => tenants.id),

        // Timestamps
        occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (table) => [
        index('idx_domain_events_event_type').on(table.eventType),
        index('idx_domain_events_aggregate').on(table.aggregateType, table.aggregateId),
        index('idx_domain_events_status').on(table.status),
        index('idx_domain_events_occurred_at').on(table.occurredAt),
        index('idx_domain_events_correlation').on(table.correlationId),
        index('idx_domain_events_tenant').on(table.tenantId)
    ]
);

// ==================== TYPE EXPORTS ====================

export type DomainEvent = typeof domainEvents.$inferSelect;
export type NewDomainEvent = typeof domainEvents.$inferInsert;
