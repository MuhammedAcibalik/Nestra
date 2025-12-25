/**
 * Event Store Repository
 * Persists domain events for replay, audit, and saga pattern support
 * Following Repository Pattern
 */

import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Database } from '../../db';
import { domainEvents, DomainEvent, NewDomainEvent } from '../../db/schema';
import { IDomainEvent } from '../interfaces/event.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('EventStore');

// ==================== INTERFACES ====================

export interface IEventStoreQuery {
    aggregateType?: string;
    aggregateId?: string;
    eventType?: string;
    fromDate?: Date;
    toDate?: Date;
    status?: 'pending' | 'processed' | 'failed' | 'dead_letter';
    tenantId?: string;
    correlationId?: string;
    limit?: number;
    offset?: number;
}

export interface IEventStoreStats {
    total: number;
    pending: number;
    processed: number;
    failed: number;
    deadLetter: number;
}

// ==================== EVENT STORE REPOSITORY ====================

export class EventStoreRepository {
    constructor(private readonly db: Database) {}

    /**
     * Store a domain event
     */
    async store(
        event: IDomainEvent,
        options?: { tenantId?: string; correlationId?: string; causationId?: string }
    ): Promise<DomainEvent> {
        const [stored] = await this.db
            .insert(domainEvents)
            .values({
                eventId: event.eventId,
                eventType: event.eventType,
                aggregateType: event.aggregateType,
                aggregateId: event.aggregateId,
                payload: event.payload,
                metadata: {},
                correlationId: options?.correlationId,
                causationId: options?.causationId,
                tenantId: options?.tenantId,
                occurredAt: event.timestamp,
                status: 'pending'
            })
            .returning();

        logger.debug('Event stored', { eventId: event.eventId, eventType: event.eventType });
        return stored;
    }

    /**
     * Store multiple events in a transaction
     */
    async storeMany(
        events: IDomainEvent[],
        options?: { tenantId?: string; correlationId?: string }
    ): Promise<DomainEvent[]> {
        if (events.length === 0) return [];

        const values: NewDomainEvent[] = events.map((event) => ({
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            metadata: {},
            correlationId: options?.correlationId,
            tenantId: options?.tenantId,
            occurredAt: event.timestamp,
            status: 'pending' as const
        }));

        const stored = await this.db.insert(domainEvents).values(values).returning();
        logger.debug('Events stored', { count: stored.length });
        return stored;
    }

    /**
     * Mark event as processed
     */
    async markProcessed(eventId: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'processed',
                processedAt: new Date()
            })
            .where(eq(domainEvents.eventId, eventId));
    }

    /**
     * Mark event as failed
     */
    async markFailed(eventId: string, error: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'failed',
                error,
                retryCount: sql`CAST(COALESCE(${domainEvents.retryCount}, '0')::int + 1 AS VARCHAR)`
            })
            .where(eq(domainEvents.eventId, eventId));
    }

    /**
     * Move to dead letter queue
     */
    async moveToDeadLetter(eventId: string, error: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'dead_letter',
                error
            })
            .where(eq(domainEvents.eventId, eventId));
    }

    /**
     * Find event by ID
     */
    async findByEventId(eventId: string): Promise<DomainEvent | null> {
        const [event] = await this.db.select().from(domainEvents).where(eq(domainEvents.eventId, eventId)).limit(1);
        return event ?? null;
    }

    /**
     * Query events with filters
     */
    async query(options: IEventStoreQuery): Promise<DomainEvent[]> {
        const conditions = [];

        if (options.aggregateType) {
            conditions.push(eq(domainEvents.aggregateType, options.aggregateType));
        }
        if (options.aggregateId) {
            conditions.push(eq(domainEvents.aggregateId, options.aggregateId));
        }
        if (options.eventType) {
            conditions.push(eq(domainEvents.eventType, options.eventType));
        }
        if (options.status) {
            conditions.push(eq(domainEvents.status, options.status));
        }
        if (options.tenantId) {
            conditions.push(eq(domainEvents.tenantId, options.tenantId));
        }
        if (options.correlationId) {
            conditions.push(eq(domainEvents.correlationId, options.correlationId));
        }
        if (options.fromDate) {
            conditions.push(gte(domainEvents.occurredAt, options.fromDate));
        }
        if (options.toDate) {
            conditions.push(lte(domainEvents.occurredAt, options.toDate));
        }

        const query = this.db
            .select()
            .from(domainEvents)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(domainEvents.occurredAt))
            .limit(options.limit ?? 100)
            .offset(options.offset ?? 0);

        return query;
    }

    /**
     * Get events for an aggregate (event sourcing replay)
     */
    async getAggregateEvents(aggregateType: string, aggregateId: string): Promise<DomainEvent[]> {
        return this.db
            .select()
            .from(domainEvents)
            .where(and(eq(domainEvents.aggregateType, aggregateType), eq(domainEvents.aggregateId, aggregateId)))
            .orderBy(domainEvents.occurredAt);
    }

    /**
     * Get pending events for processing
     */
    async getPendingEvents(limit: number = 100): Promise<DomainEvent[]> {
        return this.db
            .select()
            .from(domainEvents)
            .where(eq(domainEvents.status, 'pending'))
            .orderBy(domainEvents.occurredAt)
            .limit(limit);
    }

    /**
     * Get failed events for retry
     */
    async getFailedEvents(maxRetries: number = 3, limit: number = 100): Promise<DomainEvent[]> {
        return this.db
            .select()
            .from(domainEvents)
            .where(and(eq(domainEvents.status, 'failed'), sql`CAST(${domainEvents.retryCount} AS INT) < ${maxRetries}`))
            .orderBy(domainEvents.occurredAt)
            .limit(limit);
    }

    /**
     * Get statistics
     */
    async getStats(tenantId?: string): Promise<IEventStoreStats> {
        const baseCondition = tenantId ? eq(domainEvents.tenantId, tenantId) : undefined;

        const [stats] = await this.db
            .select({
                total: sql<number>`count(*)::int`,
                pending: sql<number>`count(*) filter (where ${domainEvents.status} = 'pending')::int`,
                processed: sql<number>`count(*) filter (where ${domainEvents.status} = 'processed')::int`,
                failed: sql<number>`count(*) filter (where ${domainEvents.status} = 'failed')::int`,
                deadLetter: sql<number>`count(*) filter (where ${domainEvents.status} = 'dead_letter')::int`
            })
            .from(domainEvents)
            .where(baseCondition);

        return stats;
    }

    /**
     * Clean old processed events
     */
    async cleanOldEvents(olderThanDays: number): Promise<number> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);

        const deleted = await this.db
            .delete(domainEvents)
            .where(and(eq(domainEvents.status, 'processed'), lte(domainEvents.occurredAt, cutoff)))
            .returning();

        logger.info('Old events cleaned', { count: deleted.length, olderThanDays });
        return deleted.length;
    }
}

// ==================== SINGLETON ====================

let eventStoreInstance: EventStoreRepository | null = null;

export function initializeEventStore(db: Database): EventStoreRepository {
    eventStoreInstance = new EventStoreRepository(db);
    return eventStoreInstance;
}

export function getEventStore(): EventStoreRepository | null {
    return eventStoreInstance;
}
