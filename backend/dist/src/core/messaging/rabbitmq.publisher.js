"use strict";
/**
 * RabbitMQ Publisher
 * Implements IEventPublisher interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQPublisher = void 0;
const api_1 = require("@opentelemetry/api");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const rabbitmq_connection_1 = require("./rabbitmq.connection");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('RabbitMQPublisher');
const tracer = api_1.trace.getTracer('messaging', '1.0.0');
// ==================== PUBLISHER CLASS ====================
class RabbitMQPublisher {
    connection;
    exchange;
    constructor(connection) {
        this.connection = connection ?? rabbitmq_connection_1.RabbitMQConnection.getInstance();
        this.exchange = this.connection.getConfig().exchange;
    }
    /**
     * Publish a single event to RabbitMQ
     */
    async publish(event) {
        const span = tracer.startSpan('messaging.publish', {
            attributes: {
                'messaging.system': 'rabbitmq',
                'messaging.destination.name': event.eventType,
                'messaging.operation.type': 'publish',
                'messaging.message.id': event.eventId
            }
        });
        return api_1.context.with(api_1.trace.setSpan(api_1.context.active(), span), async () => {
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
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                logger.debug('Event published', { eventType: event.eventType, exchange: this.exchange });
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error instanceof Error ? error.message : String(error)
                });
                if (error instanceof Error) {
                    span.setAttribute(semantic_conventions_1.ATTR_ERROR_TYPE, error.name);
                    span.recordException(error);
                }
                logger.error('Failed to publish event', { eventType: event.eventType, error });
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * Publish multiple events
     */
    async publishMany(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
    /**
     * Publish with confirmation
     */
    publishWithConfirm(channel, routingKey, message, event) {
        return new Promise((resolve, reject) => {
            channel.publish(this.exchange, routingKey, message, {
                persistent: true, // Durable message
                contentType: 'application/json',
                messageId: event.eventId,
                timestamp: event.timestamp.getTime(),
                headers: {
                    aggregateType: event.aggregateType,
                    aggregateId: event.aggregateId
                }
            }, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.RabbitMQPublisher = RabbitMQPublisher;
//# sourceMappingURL=rabbitmq.publisher.js.map