"use strict";
/**
 * Event Store Repository
 * Persists domain events for replay, audit, and saga pattern support
 * Following Repository Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStoreRepository = void 0;
exports.initializeEventStore = initializeEventStore;
exports.getEventStore = getEventStore;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../../db/schema");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('EventStore');
// ==================== EVENT STORE REPOSITORY ====================
class EventStoreRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Store a domain event
     */
    async store(event, options) {
        const [stored] = await this.db.insert(schema_1.domainEvents).values({
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
        }).returning();
        logger.debug('Event stored', { eventId: event.eventId, eventType: event.eventType });
        return stored;
    }
    /**
     * Store multiple events in a transaction
     */
    async storeMany(events, options) {
        if (events.length === 0)
            return [];
        const values = events.map(event => ({
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            metadata: {},
            correlationId: options?.correlationId,
            tenantId: options?.tenantId,
            occurredAt: event.timestamp,
            status: 'pending'
        }));
        const stored = await this.db.insert(schema_1.domainEvents).values(values).returning();
        logger.debug('Events stored', { count: stored.length });
        return stored;
    }
    /**
     * Mark event as processed
     */
    async markProcessed(eventId) {
        await this.db.update(schema_1.domainEvents)
            .set({
            status: 'processed',
            processedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.domainEvents.eventId, eventId));
    }
    /**
     * Mark event as failed
     */
    async markFailed(eventId, error) {
        await this.db.update(schema_1.domainEvents)
            .set({
            status: 'failed',
            error,
            retryCount: (0, drizzle_orm_1.sql) `CAST(COALESCE(${schema_1.domainEvents.retryCount}, '0')::int + 1 AS VARCHAR)`
        })
            .where((0, drizzle_orm_1.eq)(schema_1.domainEvents.eventId, eventId));
    }
    /**
     * Move to dead letter queue
     */
    async moveToDeadLetter(eventId, error) {
        await this.db.update(schema_1.domainEvents)
            .set({
            status: 'dead_letter',
            error
        })
            .where((0, drizzle_orm_1.eq)(schema_1.domainEvents.eventId, eventId));
    }
    /**
     * Find event by ID
     */
    async findByEventId(eventId) {
        const [event] = await this.db.select()
            .from(schema_1.domainEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.domainEvents.eventId, eventId))
            .limit(1);
        return event ?? null;
    }
    /**
     * Query events with filters
     */
    async query(options) {
        const conditions = [];
        if (options.aggregateType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.aggregateType, options.aggregateType));
        }
        if (options.aggregateId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.aggregateId, options.aggregateId));
        }
        if (options.eventType) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.eventType, options.eventType));
        }
        if (options.status) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.status, options.status));
        }
        if (options.tenantId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.tenantId, options.tenantId));
        }
        if (options.correlationId) {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.domainEvents.correlationId, options.correlationId));
        }
        if (options.fromDate) {
            conditions.push((0, drizzle_orm_1.gte)(schema_1.domainEvents.occurredAt, options.fromDate));
        }
        if (options.toDate) {
            conditions.push((0, drizzle_orm_1.lte)(schema_1.domainEvents.occurredAt, options.toDate));
        }
        const query = this.db.select()
            .from(schema_1.domainEvents)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.domainEvents.occurredAt))
            .limit(options.limit ?? 100)
            .offset(options.offset ?? 0);
        return query;
    }
    /**
     * Get events for an aggregate (event sourcing replay)
     */
    async getAggregateEvents(aggregateType, aggregateId) {
        return this.db.select()
            .from(schema_1.domainEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.domainEvents.aggregateType, aggregateType), (0, drizzle_orm_1.eq)(schema_1.domainEvents.aggregateId, aggregateId)))
            .orderBy(schema_1.domainEvents.occurredAt);
    }
    /**
     * Get pending events for processing
     */
    async getPendingEvents(limit = 100) {
        return this.db.select()
            .from(schema_1.domainEvents)
            .where((0, drizzle_orm_1.eq)(schema_1.domainEvents.status, 'pending'))
            .orderBy(schema_1.domainEvents.occurredAt)
            .limit(limit);
    }
    /**
     * Get failed events for retry
     */
    async getFailedEvents(maxRetries = 3, limit = 100) {
        return this.db.select()
            .from(schema_1.domainEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.domainEvents.status, 'failed'), (0, drizzle_orm_1.sql) `CAST(${schema_1.domainEvents.retryCount} AS INT) < ${maxRetries}`))
            .orderBy(schema_1.domainEvents.occurredAt)
            .limit(limit);
    }
    /**
     * Get statistics
     */
    async getStats(tenantId) {
        const baseCondition = tenantId ? (0, drizzle_orm_1.eq)(schema_1.domainEvents.tenantId, tenantId) : undefined;
        const [stats] = await this.db.select({
            total: (0, drizzle_orm_1.sql) `count(*)::int`,
            pending: (0, drizzle_orm_1.sql) `count(*) filter (where ${schema_1.domainEvents.status} = 'pending')::int`,
            processed: (0, drizzle_orm_1.sql) `count(*) filter (where ${schema_1.domainEvents.status} = 'processed')::int`,
            failed: (0, drizzle_orm_1.sql) `count(*) filter (where ${schema_1.domainEvents.status} = 'failed')::int`,
            deadLetter: (0, drizzle_orm_1.sql) `count(*) filter (where ${schema_1.domainEvents.status} = 'dead_letter')::int`
        })
            .from(schema_1.domainEvents)
            .where(baseCondition);
        return stats;
    }
    /**
     * Clean old processed events
     */
    async cleanOldEvents(olderThanDays) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);
        const deleted = await this.db.delete(schema_1.domainEvents)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.domainEvents.status, 'processed'), (0, drizzle_orm_1.lte)(schema_1.domainEvents.occurredAt, cutoff)))
            .returning();
        logger.info('Old events cleaned', { count: deleted.length, olderThanDays });
        return deleted.length;
    }
}
exports.EventStoreRepository = EventStoreRepository;
// ==================== SINGLETON ====================
let eventStoreInstance = null;
function initializeEventStore(db) {
    eventStoreInstance = new EventStoreRepository(db);
    return eventStoreInstance;
}
function getEventStore() {
    return eventStoreInstance;
}
//# sourceMappingURL=event-store.repository.js.map