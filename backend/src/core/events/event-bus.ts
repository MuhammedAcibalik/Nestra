/**
 * Event Bus - In-Memory Implementation
 * Following Singleton Pattern for global event handling
 * Enables loose coupling between modules (microservices communication)
 */

import { IDomainEvent, IEventSubscriber, ITypedEventPublisher } from '../interfaces/event.interface';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('EventBus');
type EventHandler = (event: IDomainEvent) => Promise<void>;

/**
 * In-Memory Event Bus with type-safe publishing
 * For production, this can be replaced with Redis/RabbitMQ implementation
 */
export class EventBus implements ITypedEventPublisher, IEventSubscriber {
    private static instance: EventBus;
    private readonly handlers: Map<string, Set<EventHandler>> = new Map();
    private eventLog: IDomainEvent[] = [];
    private readonly maxLogSize = 1000;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Publish a single event
     */
    async publish(event: IDomainEvent): Promise<void> {
        // Log event
        this.logEvent(event);
        logger.debug('Event published', {
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId
        });

        // Get handlers for this event type
        const handlers = this.handlers.get(event.eventType);
        if (!handlers || handlers.size === 0) {
            return;
        }

        // Execute all handlers (fire and forget style)
        const handlerPromises = Array.from(handlers).map(async (handler) => {
            try {
                await handler(event);
            } catch (error) {
                logger.error('Handler failed', { eventType: event.eventType, error });
            }
        });

        // Wait for all handlers to complete
        await Promise.all(handlerPromises);
    }

    /**
     * Publish multiple events
     */
    async publishMany(events: IDomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    /**
     * Type-safe publish with automatic event ID and timestamp
     * Eliminates need for `as unknown as` casts in event handlers
     */
    async publishTyped<T extends Record<string, unknown>>(
        eventType: string,
        aggregateType: string,
        aggregateId: string,
        payload: T
    ): Promise<void> {
        const event: IDomainEvent<T> = {
            eventId: generateEventId(),
            eventType,
            timestamp: new Date(),
            aggregateType,
            aggregateId,
            payload
        };
        await this.publish(event);
    }

    /**
     * Subscribe to an event type
     */
    subscribe(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType)!.add(handler);
        logger.debug('Subscribed to event', { eventType });
    }

    /**
     * Subscribe with typed handler
     */
    subscribeTyped<T extends Record<string, unknown>>(
        eventType: string,
        handler: (event: IDomainEvent<T>) => Promise<void>
    ): void {
        this.subscribe(eventType, handler as EventHandler);
    }

    /**
     * Unsubscribe from an event type (removes all handlers)
     */
    unsubscribe(eventType: string): void {
        this.handlers.delete(eventType);
        logger.debug('Unsubscribed from event', { eventType });
    }

    /**
     * Unsubscribe a specific handler
     */
    unsubscribeHandler(eventType: string, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    /**
     * Get all registered event types
     */
    getRegisteredEventTypes(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * Get recent events (for debugging/monitoring)
     */
    getRecentEvents(count = 10): IDomainEvent[] {
        return this.eventLog.slice(-count);
    }

    /**
     * Clear event log
     */
    clearEventLog(): void {
        this.eventLog = [];
    }

    /**
     * Log event with size limit
     */
    private logEvent(event: IDomainEvent): void {
        this.eventLog.push(event);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize);
        }
    }

    /**
     * Reset singleton (for testing)
     */
    public static reset(): void {
        if (EventBus.instance) {
            EventBus.instance.handlers.clear();
            EventBus.instance.eventLog = [];
        }
        EventBus.instance = undefined as unknown as EventBus;
    }
}

/**
 * Helper function to create domain events
 */
export function createDomainEvent<T extends object>(
    eventType: string,
    aggregateType: string,
    aggregateId: string,
    payload: T
): IDomainEvent {
    return {
        eventId: generateEventId(),
        eventType,
        timestamp: new Date(),
        aggregateType,
        aggregateId,
        payload: payload as Record<string, unknown>
    };
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
