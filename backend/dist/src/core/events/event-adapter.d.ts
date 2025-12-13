/**
 * Event Handler Adapter
 * Bridges message bus with event handlers
 * Enables seamless switching between in-memory and RabbitMQ
 */
import { IDomainEvent } from '../interfaces/event.interface';
type EventHandler = (event: IDomainEvent) => Promise<void>;
export interface IEventHandlerAdapter {
    subscribe(eventType: string, handler: EventHandler): void;
    publish(event: IDomainEvent): Promise<void>;
    publishMany(events: IDomainEvent[]): Promise<void>;
}
export declare function getEventAdapter(): IEventHandlerAdapter;
export declare function resetEventAdapter(): void;
export {};
//# sourceMappingURL=event-adapter.d.ts.map