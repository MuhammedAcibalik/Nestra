/**
 * Message Bus Factory
 * Strategy Pattern - Switches between in-memory EventBus and RabbitMQ
 * Based on environment configuration
 */

import { IEventPublisher, IEventSubscriber } from '../interfaces/event.interface';
import { EventBus } from '../events/event-bus';
import { RabbitMQConnection } from './rabbitmq.connection';
import { RabbitMQPublisher } from './rabbitmq.publisher';
import { RabbitMQSubscriber } from './rabbitmq.subscriber';

// ==================== CONFIG ====================

export type MessageBusType = 'memory' | 'rabbitmq';

export interface IMessageBusConfig {
    type: MessageBusType;
    rabbitmqUrl?: string;
}

export interface IMessageBus {
    publisher: IEventPublisher;
    subscriber: IEventSubscriber;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
}

// ==================== FACTORY FUNCTION ====================

/**
 * Create message bus based on configuration
 */
export function createMessageBus(config?: Partial<IMessageBusConfig>): IMessageBus {
    const busType = (config?.type ?? (process.env.USE_RABBITMQ === 'true' ? 'rabbitmq' : 'memory')) as MessageBusType;

    if (busType === 'rabbitmq') {
        return createRabbitMQBus(config?.rabbitmqUrl);
    }

    return createInMemoryBus();
}

// ==================== IN-MEMORY BUS ====================

function createInMemoryBus(): IMessageBus {
    const eventBus = EventBus.getInstance();

    return {
        publisher: eventBus,
        subscriber: eventBus,

        async connect(): Promise<void> {
            console.log('[MESSAGE BUS] Using in-memory EventBus');
        },

        async disconnect(): Promise<void> {
            console.log('[MESSAGE BUS] In-memory EventBus disconnected');
        },

        isConnected(): boolean {
            return true; // Always connected for in-memory
        }
    };
}

// ==================== RABBITMQ BUS ====================

function createRabbitMQBus(url?: string): IMessageBus {
    const connection = RabbitMQConnection.getInstance({
        url: url ?? process.env.RABBITMQ_URL
    });

    const publisher = new RabbitMQPublisher(connection);
    const subscriber = new RabbitMQSubscriber(connection);

    return {
        publisher,
        subscriber,

        async connect(): Promise<void> {
            await connection.connect();
            await subscriber.initialize();
            await subscriber.startConsumingAll();
            console.log('[MESSAGE BUS] RabbitMQ connected and consuming');
        },

        async disconnect(): Promise<void> {
            await subscriber.stopAllConsumers();
            await connection.disconnect();
            console.log('[MESSAGE BUS] RabbitMQ disconnected');
        },

        isConnected(): boolean {
            return connection.isConnected();
        }
    };
}

// ==================== SINGLETON INSTANCE ====================

let messageBusInstance: IMessageBus | null = null;

export function getMessageBus(): IMessageBus {
    if (!messageBusInstance) {
        messageBusInstance = createMessageBus();
    }
    return messageBusInstance;
}

export async function initializeMessageBus(config?: Partial<IMessageBusConfig>): Promise<IMessageBus> {
    messageBusInstance = createMessageBus(config);
    await messageBusInstance.connect();
    return messageBusInstance;
}

export async function shutdownMessageBus(): Promise<void> {
    if (messageBusInstance) {
        await messageBusInstance.disconnect();
        messageBusInstance = null;
    }
}
