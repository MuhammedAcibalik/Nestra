/**
 * Event Handler Adapter
 * Bridges message bus with event handlers
 * Enables seamless switching between in-memory and RabbitMQ
 */

import { IEventSubscriber, IDomainEvent, IEventPublisher } from '../interfaces/event.interface';
import { getMessageBus } from '../messaging';

type EventHandler = (event: IDomainEvent) => Promise<void>;

// ==================== ADAPTER INTERFACE ====================

export interface IEventHandlerAdapter {
    subscribe(eventType: string, handler: EventHandler): void;
    publish(event: IDomainEvent): Promise<void>;
    publishMany(events: IDomainEvent[]): Promise<void>;
}

// ==================== ADAPTER IMPLEMENTATION ====================

/**
 * Event Handler Adapter
 * Provides unified interface for both RabbitMQ and in-memory event handling
 */
class EventHandlerAdapter implements IEventHandlerAdapter {
    private subscriber: IEventSubscriber | null = null;
    private publisher: IEventPublisher | null = null;

    /**
     * Get cached subscriber instance
     */
    private getSubscriber(): IEventSubscriber {
        this.subscriber ??= getMessageBus().subscriber;
        return this.subscriber;
    }

    /**
     * Get cached publisher instance
     */
    private getPublisher(): IEventPublisher {
        this.publisher ??= getMessageBus().publisher;
        return this.publisher;
    }

    /**
     * Subscribe to an event type
     */
    subscribe(eventType: string, handler: EventHandler): void {
        this.getSubscriber().subscribe(eventType, handler);
    }

    /**
     * Publish a single event
     */
    async publish(event: IDomainEvent): Promise<void> {
        await this.getPublisher().publish(event);
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
     * Reset cached instances (for testing)
     */
    reset(): void {
        this.subscriber = null;
        this.publisher = null;
    }
}

// ==================== SINGLETON INSTANCE ====================

let adapterInstance: EventHandlerAdapter | null = null;

export function getEventAdapter(): IEventHandlerAdapter {
    adapterInstance ??= new EventHandlerAdapter();
    return adapterInstance;
}

export function resetEventAdapter(): void {
    if (adapterInstance) {
        adapterInstance.reset();
    }
    adapterInstance = null;
}
