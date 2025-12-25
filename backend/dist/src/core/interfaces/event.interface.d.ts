/**
 * Event System Interfaces
 * For microservices communication
 */
/**
 * Domain event with optional generic payload type
 * Use generic version for type-safe event handling
 */
export interface IDomainEvent<T extends Record<string, unknown> = Record<string, unknown>> {
    eventId: string;
    eventType: string;
    timestamp: Date;
    payload: T;
    aggregateId: string;
    aggregateType: string;
}
/**
 * Create a typed event interface for a specific payload
 */
export type TypedDomainEvent<T extends Record<string, unknown>> = IDomainEvent<T>;
/**
 * Handler for typed events
 */
export type TypedEventHandler<T extends Record<string, unknown>> = (event: IDomainEvent<T>) => Promise<void>;
export interface IEventPublisher {
    publish(event: IDomainEvent): Promise<void>;
    publishMany(events: IDomainEvent[]): Promise<void>;
}
export interface IEventSubscriber {
    subscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void;
    unsubscribe(eventType: string): void;
}
/**
 * Type-safe event publisher with generic support
 */
export interface ITypedEventPublisher extends IEventPublisher {
    publishTyped<T extends Record<string, unknown>>(eventType: string, aggregateType: string, aggregateId: string, payload: T): Promise<void>;
}
//# sourceMappingURL=event.interface.d.ts.map