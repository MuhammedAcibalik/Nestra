"use strict";
/**
 * RabbitMQ Publisher
 * Implements IEventPublisher interface for RabbitMQ
 * Following Strategy Pattern - Can be swapped with in-memory EventBus
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQPublisher = void 0;
const rabbitmq_connection_1 = require("./rabbitmq.connection");
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
        }
        catch (error) {
            console.error(`[RABBITMQ PUBLISHER] Failed to publish ${event.eventType}:`, error);
            throw error;
        }
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