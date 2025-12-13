/**
 * RabbitMQ Subscriber
 * Implements IEventSubscriber interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */
import { IEventSubscriber, IDomainEvent } from '../interfaces/event.interface';
import { RabbitMQConnection } from './rabbitmq.connection';
type EventHandler = (event: IDomainEvent) => Promise<void>;
export interface IQueueConfig {
    name: string;
    routingPatterns: string[];
    options?: {
        durable?: boolean;
        maxRetries?: number;
    };
}
export declare const defaultQueues: IQueueConfig[];
export declare class RabbitMQSubscriber implements IEventSubscriber {
    private readonly connection;
    private readonly config;
    private readonly handlers;
    private readonly consumerTags;
    private initialized;
    constructor(connection?: RabbitMQConnection);
    /**
     * Initialize queues and bindings
     */
    initialize(queues?: IQueueConfig[]): Promise<void>;
    /**
     * Subscribe to an event type
     */
    subscribe(eventType: string, handler: EventHandler): void;
    /**
     * Start consuming from a queue
     */
    startConsuming(queueName: string): Promise<void>;
    /**
     * Start consuming from all default queues
     */
    startConsumingAll(): Promise<void>;
    /**
     * Stop consuming from a queue
     */
    stopConsuming(queueName: string): Promise<void>;
    /**
     * Stop all consumers
     */
    stopAllConsumers(): Promise<void>;
    /**
     * Unsubscribe from event type
     */
    unsubscribe(eventType: string): void;
    /**
     * Setup a queue with bindings
     */
    private setupQueue;
    /**
     * Handle incoming message
     */
    private handleMessage;
}
export {};
//# sourceMappingURL=rabbitmq.subscriber.d.ts.map