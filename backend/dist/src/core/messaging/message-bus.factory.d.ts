/**
 * Message Bus Factory
 * Strategy Pattern - Switches between in-memory EventBus and RabbitMQ
 * Based on environment configuration
 */
import { IEventPublisher, IEventSubscriber } from '../interfaces/event.interface';
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
/**
 * Create message bus based on configuration
 */
export declare function createMessageBus(config?: Partial<IMessageBusConfig>): IMessageBus;
export declare function getMessageBus(): IMessageBus;
export declare function initializeMessageBus(config?: Partial<IMessageBusConfig>): Promise<IMessageBus>;
export declare function shutdownMessageBus(): Promise<void>;
//# sourceMappingURL=message-bus.factory.d.ts.map