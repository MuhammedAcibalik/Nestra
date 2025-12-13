/**
 * RabbitMQ Publisher
 * Implements IEventPublisher interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */

import * as amqp from 'amqplib';
import { IEventPublisher, IDomainEvent } from '../interfaces/event.interface';
import { RabbitMQConnection } from './rabbitmq.connection';

// ==================== PUBLISHER CLASS ====================

export class RabbitMQPublisher implements IEventPublisher {
    private readonly connection: RabbitMQConnection;
    private readonly exchange: string;

    constructor(connection?: RabbitMQConnection) {
        this.connection = connection ?? RabbitMQConnection.getInstance();
        this.exchange = this.connection.getConfig().exchange;
    }

    /**
     * Publish a single event to RabbitMQ
     */
    async publish(event: IDomainEvent): Promise<void> {
        const channel = this.connection.getConfirmChannel();

        if (!channel) {
            console.error('[RABBITMQ PUBLISHER] No channel available, event dropped:', event.eventType);
            throw new Error('RabbitMQ channel not available');
        }

        try {
            const routingKey = event.eventType; // e.g., 'order.created'
            const message = Buffer.from(JSON.stringify(event));

            await this.publishWithConfirm(channel, routingKey, message, event);

            console.log(`[RABBITMQ PUBLISHER] Published: ${event.eventType} -> ${this.exchange}`);

        } catch (error) {
            console.error(`[RABBITMQ PUBLISHER] Failed to publish ${event.eventType}:`, error);
            throw error;
        }
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
     * Publish with confirmation
     */
    private publishWithConfirm(
        channel: amqp.ConfirmChannel,
        routingKey: string,
        message: Buffer,
        event: IDomainEvent
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            channel.publish(
                this.exchange,
                routingKey,
                message,
                {
                    persistent: true, // Durable message
                    contentType: 'application/json',
                    messageId: event.eventId,
                    timestamp: event.timestamp.getTime(),
                    headers: {
                        aggregateType: event.aggregateType,
                        aggregateId: event.aggregateId
                    }
                },
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}
