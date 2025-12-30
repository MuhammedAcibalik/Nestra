/**
 * Outbox Pattern Processor
 * Guarantees at-least-once delivery of events
 * Processes pending events from domain_events table
 */

import { eq, lt, and, sql } from 'drizzle-orm';
import { Database } from '../../db';
import { domainEvents, DomainEvent } from '../../db/schema';
import { EventBus } from './event-bus';
import { createModuleLogger } from '../logger';
import { IDomainEvent } from '../interfaces/event.interface';

const logger = createModuleLogger('OutboxProcessor');

// ==================== CONFIGURATION ====================

export interface IOutboxConfig {
    /** How often to process pending events (ms) */
    pollingInterval: number;
    /** Maximum events to process per batch */
    batchSize: number;
    /** Maximum retries before moving to dead letter */
    maxRetries: number;
    /** Delay between retries (ms) */
    retryDelay: number;
}

const DEFAULT_CONFIG: IOutboxConfig = {
    pollingInterval: 5000,  // 5 seconds
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000
};

// ==================== OUTBOX PROCESSOR ====================

export class OutboxProcessor {
    private isRunning = false;
    private intervalId: NodeJS.Timeout | null = null;
    private readonly config: IOutboxConfig;

    constructor(
        private readonly db: Database,
        private readonly eventBus: EventBus,
        config?: Partial<IOutboxConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Start processing outbox events
     */
    start(): void {
        if (this.isRunning) {
            logger.warn('OutboxProcessor already running');
            return;
        }

        this.isRunning = true;
        logger.info('OutboxProcessor started', {
            pollingInterval: this.config.pollingInterval,
            batchSize: this.config.batchSize
        });

        // Initial processing
        void this.processOutbox();

        // Schedule periodic processing
        this.intervalId = setInterval(() => {
            void this.processOutbox();
        }, this.config.pollingInterval);
    }

    /**
     * Stop processing outbox events
     */
    stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info('OutboxProcessor stopped');
    }

    /**
     * Process pending events from outbox
     */
    async processOutbox(): Promise<number> {
        try {
            // Get pending events
            const pendingEvents = await this.getPendingEvents();

            if (pendingEvents.length === 0) {
                return 0;
            }

            logger.debug('Processing outbox events', { count: pendingEvents.length });

            let processed = 0;
            for (const event of pendingEvents) {
                try {
                    await this.processEvent(event);
                    processed++;
                } catch (error) {
                    logger.error('Failed to process event', {
                        eventId: event.eventId,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            }

            logger.info('Outbox processing complete', { processed, total: pendingEvents.length });
            return processed;

        } catch (error) {
            logger.error('Outbox processing error', {
                error: error instanceof Error ? error.message : String(error)
            });
            return 0;
        }
    }

    /**
     * Get pending events from database
     */
    private async getPendingEvents(): Promise<DomainEvent[]> {
        return this.db
            .select()
            .from(domainEvents)
            .where(eq(domainEvents.status, 'pending'))
            .orderBy(domainEvents.occurredAt)
            .limit(this.config.batchSize);
    }

    /**
     * Process a single event
     */
    private async processEvent(event: DomainEvent): Promise<void> {
        const domainEvent = this.toDomainEvent(event);

        try {
            // Publish to EventBus
            await this.eventBus.publish(domainEvent);

            // Mark as processed
            await this.markProcessed(event.id);

        } catch (error) {
            const retryCount = Number.parseInt(event.retryCount ?? '0', 10);

            if (retryCount >= this.config.maxRetries) {
                // Move to dead letter
                await this.markDeadLetter(event.id, error instanceof Error ? error.message : String(error));
            } else {
                // Mark as failed for retry
                await this.markFailed(event.id, error instanceof Error ? error.message : String(error));
            }

            throw error;
        }
    }

    /**
     * Convert database event to domain event
     */
    private toDomainEvent(event: DomainEvent): IDomainEvent {
        return {
            eventId: event.eventId,
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            timestamp: event.occurredAt,
            payload: event.payload as Record<string, unknown>
        };
    }

    /**
     * Mark event as processed
     */
    private async markProcessed(id: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'processed',
                processedAt: new Date()
            })
            .where(eq(domainEvents.id, id));
    }

    /**
     * Mark event as failed (for retry)
     */
    private async markFailed(id: string, error: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'failed',
                error: error.substring(0, 1000),
                retryCount: sql`CAST(COALESCE(${domainEvents.retryCount}, '0') AS INTEGER) + 1`
            })
            .where(eq(domainEvents.id, id));
    }

    /**
     * Move event to dead letter queue
     */
    private async markDeadLetter(id: string, error: string): Promise<void> {
        await this.db
            .update(domainEvents)
            .set({
                status: 'dead_letter',
                error: `DEAD_LETTER: ${error}`.substring(0, 1000)
            })
            .where(eq(domainEvents.id, id));

        logger.warn('Event moved to dead letter', { eventId: id, error });
    }

    /**
     * Retry failed events
     */
    async retryFailedEvents(): Promise<number> {
        const failedEvents = await this.db
            .select()
            .from(domainEvents)
            .where(
                and(
                    eq(domainEvents.status, 'failed'),
                    lt(sql`CAST(COALESCE(${domainEvents.retryCount}, '0') AS INTEGER)`, this.config.maxRetries)
                )
            )
            .limit(this.config.batchSize);

        // Reset status to pending for retry
        let retried = 0;
        for (const event of failedEvents) {
            await this.db
                .update(domainEvents)
                .set({ status: 'pending' })
                .where(eq(domainEvents.id, event.id));
            retried++;
        }

        if (retried > 0) {
            logger.info('Retrying failed events', { count: retried });
        }

        return retried;
    }

    /**
     * Get outbox statistics
     */
    async getStats(): Promise<{
        pending: number;
        processed: number;
        failed: number;
        deadLetter: number;
    }> {
        const stats = await this.db
            .select({
                status: domainEvents.status,
                count: sql<number>`COUNT(*)`
            })
            .from(domainEvents)
            .groupBy(domainEvents.status);

        const result = {
            pending: 0,
            processed: 0,
            failed: 0,
            deadLetter: 0
        };

        for (const stat of stats) {
            if (stat.status === 'pending') result.pending = Number(stat.count);
            if (stat.status === 'processed') result.processed = Number(stat.count);
            if (stat.status === 'failed') result.failed = Number(stat.count);
            if (stat.status === 'dead_letter') result.deadLetter = Number(stat.count);
        }

        return result;
    }
}

// ==================== SINGLETON ====================

let processorInstance: OutboxProcessor | null = null;

export function initializeOutboxProcessor(db: Database, eventBus: EventBus, config?: Partial<IOutboxConfig>): OutboxProcessor {
    processorInstance ??= new OutboxProcessor(db, eventBus, config);
    return processorInstance;
}

export function getOutboxProcessor(): OutboxProcessor | null {
    return processorInstance;
}
