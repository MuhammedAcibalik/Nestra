/**
 * RabbitMQ Connection Manager
 * Handles connection lifecycle, reconnection, and channel management
 * Following Microservice Pattern: Connection Resilience
 */
import * as amqp from 'amqplib';
import { EventEmitter } from 'node:events';
export interface IRabbitMQConfig {
    url: string;
    exchange: string;
    exchangeType: 'topic' | 'direct' | 'fanout';
    reconnectDelay: number;
    maxRetries: number;
    prefetchCount: number;
}
export interface IConnectionManager {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getChannel(): amqp.Channel | null;
    getConfirmChannel(): amqp.ConfirmChannel | null;
    isConnected(): boolean;
    on(event: string, listener: (...args: unknown[]) => void): void;
}
export declare const defaultRabbitMQConfig: IRabbitMQConfig;
export declare class RabbitMQConnection extends EventEmitter implements IConnectionManager {
    private static instance;
    private connection;
    private channel;
    private confirmChannel;
    private readonly config;
    private reconnectAttempts;
    private isReconnecting;
    private shuttingDown;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<IRabbitMQConfig>): RabbitMQConnection;
    /**
     * Establish connection to RabbitMQ
     */
    connect(): Promise<void>;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Get regular channel
     */
    getChannel(): amqp.Channel | null;
    /**
     * Get confirm channel for reliable publishing
     */
    getConfirmChannel(): amqp.ConfirmChannel | null;
    /**
     * Check connection status
     */
    isConnected(): boolean;
    /**
     * Get config
     */
    getConfig(): IRabbitMQConfig;
    /**
     * Setup the main exchange
     */
    private setupExchange;
    /**
     * Setup connection event handlers
     */
    private setupConnectionHandlers;
    /**
     * Handle reconnection with exponential backoff
     */
    private handleReconnect;
    /**
     * Reset singleton (for testing)
     */
    static reset(): void;
}
//# sourceMappingURL=rabbitmq.connection.d.ts.map