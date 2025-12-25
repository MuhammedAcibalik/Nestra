/**
 * RabbitMQ Publisher
 * Implements IEventPublisher interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */

import * as amqp from 'amqplib';
import { trace, SpanStatusCode, context as otelContext } from '@opentelemetry/api';
import { ATTR_ERROR_TYPE } from '@opentelemetry/semantic-conventions';
import { IEventPublisher, IDomainEvent } from '../interfaces/event.interface';
import { RabbitMQConnection } from './rabbitmq.connection';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('RabbitMQPublisher');
const tracer = trace.getTracer('messaging', '1.0.0');

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
        const span = tracer.startSpan('messaging.publish', {
            attributes: {
                'messaging.system': 'rabbitmq',
                'messaging.destination.name': event.eventType,
                'messaging.operation.type': 'publish',
                'messaging.message.id': event.eventId
            }
        });

        return otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
            try {
                const channel = this.connection.getConfirmChannel();

                if (!channel) {
                    logger.error('No channel available, event dropped', { eventType: event.eventType });
                    throw new Error('RabbitMQ channel not available');
                }

                const routingKey = event.eventType;
                const message = Buffer.from(JSON.stringify(event));
                span.setAttribute('messaging.message.body.size', message.length);

                await this.publishWithConfirm(channel, routingKey, message, event);

                span.setStatus({ code: SpanStatusCode.OK });
                logger.debug('Event published', { eventType: event.eventType, exchange: this.exchange });
            } catch (error) {
                span.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Failed to publish event', { eventType: event.eventType, error });
                throw error;
            } finally {
                span.end();
            }
        });
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
