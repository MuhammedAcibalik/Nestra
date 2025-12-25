/**
 * RabbitMQ Subscriber
 * Implements IEventSubscriber interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */

import * as amqp from 'amqplib';
import { IEventSubscriber, IDomainEvent } from '../interfaces/event.interface';
import { RabbitMQConnection, IRabbitMQConfig } from './rabbitmq.connection';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('RabbitMQSubscriber');

type EventHandler = (event: IDomainEvent) => Promise<void>;

// ==================== QUEUE CONFIG ====================

export interface IQueueConfig {
    name: string;
    routingPatterns: string[];
    options?: {
        durable?: boolean;
        maxRetries?: number;
    };
}

// Default queue configurations
export const defaultQueues: IQueueConfig[] = [
    {
        name: 'nestra.order',
        routingPatterns: ['order.*'],
        options: { durable: true, maxRetries: 3 }
    },
    {
        name: 'nestra.stock',
        routingPatterns: ['stock.*'],
        options: { durable: true, maxRetries: 3 }
    },
    {
        name: 'nestra.optimization',
        routingPatterns: ['optimization.*', 'plan.*'],
        options: { durable: true, maxRetries: 3 }
    },
    {
        name: 'nestra.production',
        routingPatterns: ['production.*'],
        options: { durable: true, maxRetries: 3 }
    },
    {
        name: 'nestra.material',
        routingPatterns: ['material.*'],
        options: { durable: true, maxRetries: 3 }
    },
    {
        name: 'nestra.customer',
        routingPatterns: ['customer.*', 'cutting-job.*'],
        options: { durable: true, maxRetries: 3 }
    }
];

// ==================== SUBSCRIBER CLASS ====================

export class RabbitMQSubscriber implements IEventSubscriber {
    private readonly connection: RabbitMQConnection;
    private readonly config: IRabbitMQConfig;
    private readonly handlers: Map<string, Set<EventHandler>> = new Map();
    private readonly consumerTags: Map<string, string> = new Map();
    private initialized = false;

    constructor(connection?: RabbitMQConnection) {
        this.connection = connection ?? RabbitMQConnection.getInstance();
        this.config = this.connection.getConfig();
    }

    /**
     * Initialize queues and bindings
     */
    async initialize(queues: IQueueConfig[] = defaultQueues): Promise<void> {
        if (this.initialized) return;

        const channel = this.connection.getChannel();
        if (!channel) {
            throw new Error('RabbitMQ channel not available');
        }

        for (const queue of queues) {
            await this.setupQueue(channel, queue);
        }

        this.initialized = true;
        logger.info('Initialized with queues', { queues: queues.map((q) => q.name) });
    }

    /**
     * Subscribe to an event type
     */
    subscribe(eventType: string, handler: EventHandler): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType)!.add(handler);
        logger.debug('Handler registered', { eventType });
    }

    /**
     * Start consuming from a queue
     */
    async startConsuming(queueName: string): Promise<void> {
        const channel = this.connection.getChannel();
        if (!channel) {
            throw new Error('RabbitMQ channel not available');
        }

        const { consumerTag } = await channel.consume(
            queueName,
            async (msg) => {
                if (msg) {
                    await this.handleMessage(channel, msg, queueName);
                }
            },
            { noAck: false }
        );

        this.consumerTags.set(queueName, consumerTag);
        logger.info('Consuming started', { queueName });
    }

    /**
     * Start consuming from all default queues
     */
    async startConsumingAll(): Promise<void> {
        for (const queue of defaultQueues) {
            await this.startConsuming(queue.name);
        }
    }

    /**
     * Stop consuming from a queue
     */
    async stopConsuming(queueName: string): Promise<void> {
        const channel = this.connection.getChannel();
        const consumerTag = this.consumerTags.get(queueName);

        if (channel && consumerTag) {
            await channel.cancel(consumerTag);
            this.consumerTags.delete(queueName);
            logger.info('Consuming stopped', { queueName });
        }
    }

    /**
     * Stop all consumers
     */
    async stopAllConsumers(): Promise<void> {
        for (const queueName of this.consumerTags.keys()) {
            await this.stopConsuming(queueName);
        }
    }

    /**
     * Unsubscribe from event type
     */
    unsubscribe(eventType: string): void {
        this.handlers.delete(eventType);
        logger.debug('Unsubscribed', { eventType });
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Setup a queue with bindings
     */
    private async setupQueue(channel: amqp.Channel, queue: IQueueConfig): Promise<void> {
        const dlxExchange = `${this.config.exchange}.dlx`;

        // Assert queue with dead letter exchange
        await channel.assertQueue(queue.name, {
            durable: queue.options?.durable ?? true,
            deadLetterExchange: dlxExchange,
            arguments: {
                'x-dead-letter-exchange': dlxExchange
            }
        });

        // Bind queue to exchange with routing patterns
        for (const pattern of queue.routingPatterns) {
            await channel.bindQueue(queue.name, this.config.exchange, pattern);
        }

        logger.debug('Queue bound', { queueName: queue.name, patterns: queue.routingPatterns });
    }

    /**
     * Handle incoming message
     */
    private async handleMessage(channel: amqp.Channel, msg: amqp.ConsumeMessage, queueName: string): Promise<void> {
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content) as IDomainEvent;

            // Restore Date object
            event.timestamp = new Date(event.timestamp);

            logger.debug('Event received', { eventType: event.eventType, queueName });

            // Get handlers for this event type
            const handlers = this.handlers.get(event.eventType);

            if (!handlers || handlers.size === 0) {
                // No handlers, ack the message anyway
                channel.ack(msg);
                return;
            }

            // Execute handlers
            const handlerPromises = Array.from(handlers).map(async (handler) => {
                try {
                    await handler(event);
                } catch (error) {
                    logger.error('Handler error', { eventType: event.eventType, error });
                    throw error;
                }
            });

            await Promise.all(handlerPromises);

            // Acknowledge successful processing
            channel.ack(msg);
        } catch (error) {
            logger.error('Message processing failed', { error });

            const retryCount = (msg.properties.headers?.['x-retry-count'] as number) ?? 0;
            const maxRetries = 3;

            if (retryCount < maxRetries) {
                channel.nack(msg, false, false);
                logger.warn('Message sent to DLQ', { retryCount: retryCount + 1, maxRetries });
            } else {
                channel.nack(msg, false, false);
                logger.error('Max retries reached, message sent to dead letter');
            }
        }
    }
}
