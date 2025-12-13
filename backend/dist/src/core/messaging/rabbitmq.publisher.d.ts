/**
 * RabbitMQ Publisher
 * Implements IEventPublisher interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */
import { IEventPublisher, IDomainEvent } from '../interfaces/event.interface';
import { RabbitMQConnection } from './rabbitmq.connection';
export declare class RabbitMQPublisher implements IEventPublisher {
    private readonly connection;
    private readonly exchange;
    constructor(connection?: RabbitMQConnection);
    /**
     * Publish a single event to RabbitMQ
     */
    publish(event: IDomainEvent): Promise<void>;
    /**
     * Publish multiple events
     */
    publishMany(events: IDomainEvent[]): Promise<void>;
    /**
     * Publish with confirmation
     */
    private publishWithConfirm;
}
//# sourceMappingURL=rabbitmq.publisher.d.ts.map