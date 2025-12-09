/**
 * Event System Interfaces
 * For microservices communication
 */

export interface IDomainEvent {
    eventId: string;
    eventType: string;
    timestamp: Date;
    payload: Record<string, unknown>;
    aggregateId: string;
    aggregateType: string;
}

export interface IEventPublisher {
    publish(event: IDomainEvent): Promise<void>;
    publishMany(events: IDomainEvent[]): Promise<void>;
}

export interface IEventSubscriber {
    subscribe(eventType: string, handler: (event: IDomainEvent) => Promise<void>): void;
    unsubscribe(eventType: string): void;
}
