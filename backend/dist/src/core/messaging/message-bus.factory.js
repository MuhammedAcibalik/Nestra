"use strict";
/**
 * Message Bus Factory
 * Strategy Pattern - Switches between in-memory EventBus and RabbitMQ
 * Based on environment configuration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageBus = createMessageBus;
exports.getMessageBus = getMessageBus;
exports.initializeMessageBus = initializeMessageBus;
exports.shutdownMessageBus = shutdownMessageBus;
const event_bus_1 = require("../events/event-bus");
const rabbitmq_connection_1 = require("./rabbitmq.connection");
const rabbitmq_publisher_1 = require("./rabbitmq.publisher");
const rabbitmq_subscriber_1 = require("./rabbitmq.subscriber");
const logger_1 = require("../logger");
const logger = (0, logger_1.createModuleLogger)('MessageBus');
// ==================== FACTORY FUNCTION ====================
/**
 * Create message bus based on configuration
 */
function createMessageBus(config) {
    const busType = (config?.type ?? (process.env.USE_RABBITMQ === 'true' ? 'rabbitmq' : 'memory'));
    if (busType === 'rabbitmq') {
        return createRabbitMQBus(config?.rabbitmqUrl);
    }
    return createInMemoryBus();
}
// ==================== IN-MEMORY BUS ====================
function createInMemoryBus() {
    const eventBus = event_bus_1.EventBus.getInstance();
    return {
        publisher: eventBus,
        subscriber: eventBus,
        async connect() {
            logger.info('Using in-memory EventBus');
        },
        async disconnect() {
            logger.info('In-memory EventBus disconnected');
        },
        isConnected() {
            return true; // Always connected for in-memory
        }
    };
}
// ==================== RABBITMQ BUS ====================
function createRabbitMQBus(url) {
    const connection = rabbitmq_connection_1.RabbitMQConnection.getInstance({
        url: url ?? process.env.RABBITMQ_URL
    });
    const publisher = new rabbitmq_publisher_1.RabbitMQPublisher(connection);
    const subscriber = new rabbitmq_subscriber_1.RabbitMQSubscriber(connection);
    return {
        publisher,
        subscriber,
        async connect() {
            await connection.connect();
            await subscriber.initialize();
            await subscriber.startConsumingAll();
            logger.info('RabbitMQ connected and consuming');
        },
        async disconnect() {
            await subscriber.stopAllConsumers();
            await connection.disconnect();
            logger.info('RabbitMQ disconnected');
        },
        isConnected() {
            return connection.isConnected();
        }
    };
}
// ==================== SINGLETON INSTANCE ====================
let messageBusInstance = null;
function getMessageBus() {
    if (!messageBusInstance) {
        messageBusInstance = createMessageBus();
    }
    return messageBusInstance;
}
async function initializeMessageBus(config) {
    messageBusInstance = createMessageBus(config);
    await messageBusInstance.connect();
    return messageBusInstance;
}
async function shutdownMessageBus() {
    if (messageBusInstance) {
        await messageBusInstance.disconnect();
        messageBusInstance = null;
    }
}
//# sourceMappingURL=message-bus.factory.js.map