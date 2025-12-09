/**
 * Event Bus - In-Memory Implementation
 * Following Singleton Pattern for global event handling
 * Enables loose coupling between modules (microservices communication)
 */
import { IDomainEvent, IEventPublisher, IEventSubscriber } from '../interfaces/event.interface';
type EventHandler = (event: IDomainEvent) => Promise<void>;
/**
 * In-Memory Event Bus
 * For production, this can be replaced with Redis/RabbitMQ implementation
 */
export declare class EventBus implements IEventPublisher, IEventSubscriber {
    private static instance;
    private handlers;
    private eventLog;
    private maxLogSize;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): EventBus;
    /**
     * Publish a single event
     */
    publish(event: IDomainEvent): Promise<void>;
    /**
     * Publish multiple events
     */
    publishMany(events: IDomainEvent[]): Promise<void>;
    /**
     * Subscribe to an event type
     */
    subscribe(eventType: string, handler: EventHandler): void;
    /**
     * Unsubscribe from an event type (removes all handlers)
     */
    unsubscribe(eventType: string): void;
    /**
     * Unsubscribe a specific handler
     */
    unsubscribeHandler(eventType: string, handler: EventHandler): void;
    /**
     * Get all registered event types
     */
    getRegisteredEventTypes(): string[];
    /**
     * Get recent events (for debugging/monitoring)
     */
    getRecentEvents(count?: number): IDomainEvent[];
    /**
     * Clear event log
     */
    clearEventLog(): void;
    /**
     * Log event with size limit
     */
    private logEvent;
    /**
     * Reset singleton (for testing)
     */
    static reset(): void;
}
/**
 * Helper function to create domain events
 */
export declare function createDomainEvent<T extends object>(eventType: string, aggregateType: string, aggregateId: string, payload: T): IDomainEvent;
export {};
//# sourceMappingURL=event-bus.d.ts.map