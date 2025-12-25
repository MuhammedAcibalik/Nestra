/**
 * Event Store Repository
 * Persists domain events for replay, audit, and saga pattern support
 * Following Repository Pattern
 */
import { Database } from '../../db';
import { DomainEvent } from '../../db/schema';
import { IDomainEvent } from '../interfaces/event.interface';
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
export declare class EventStoreRepository {
    private readonly db;
    constructor(db: Database);
    /**
     * Store a domain event
     */
    store(event: IDomainEvent, options?: {
        tenantId?: string;
        correlationId?: string;
        causationId?: string;
    }): Promise<DomainEvent>;
    /**
     * Store multiple events in a transaction
     */
    storeMany(events: IDomainEvent[], options?: {
        tenantId?: string;
        correlationId?: string;
    }): Promise<DomainEvent[]>;
    /**
     * Mark event as processed
     */
    markProcessed(eventId: string): Promise<void>;
    /**
     * Mark event as failed
     */
    markFailed(eventId: string, error: string): Promise<void>;
    /**
     * Move to dead letter queue
     */
    moveToDeadLetter(eventId: string, error: string): Promise<void>;
    /**
     * Find event by ID
     */
    findByEventId(eventId: string): Promise<DomainEvent | null>;
    /**
     * Query events with filters
     */
    query(options: IEventStoreQuery): Promise<DomainEvent[]>;
    /**
     * Get events for an aggregate (event sourcing replay)
     */
    getAggregateEvents(aggregateType: string, aggregateId: string): Promise<DomainEvent[]>;
    /**
     * Get pending events for processing
     */
    getPendingEvents(limit?: number): Promise<DomainEvent[]>;
    /**
     * Get failed events for retry
     */
    getFailedEvents(maxRetries?: number, limit?: number): Promise<DomainEvent[]>;
    /**
     * Get statistics
     */
    getStats(tenantId?: string): Promise<IEventStoreStats>;
    /**
     * Clean old processed events
     */
    cleanOldEvents(olderThanDays: number): Promise<number>;
}
export declare function initializeEventStore(db: Database): EventStoreRepository;
export declare function getEventStore(): EventStoreRepository | null;
//# sourceMappingURL=event-store.repository.d.ts.map