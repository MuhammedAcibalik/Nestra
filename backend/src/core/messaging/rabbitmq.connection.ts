/**
 * RabbitMQ Connection Manager
 * Handles connection lifecycle, reconnection, and channel management
 * Following Microservice Pattern: Connection Resilience
 */

import * as amqp from 'amqplib';
import { EventEmitter } from 'node:events';

// ==================== INTERFACES ====================

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

// ==================== DEFAULT CONFIG ====================

export const defaultRabbitMQConfig: IRabbitMQConfig = {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'nestra.events',
    exchangeType: 'topic',
    reconnectDelay: Number.parseInt(process.env.RABBITMQ_RETRY_DELAY ?? '5000', 10),
    maxRetries: Number.parseInt(process.env.RABBITMQ_MAX_RETRIES ?? '10', 10),
    prefetchCount: Number.parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10)
};

// ==================== CONNECTION MANAGER ====================

export class RabbitMQConnection extends EventEmitter implements IConnectionManager {
    private static instance: RabbitMQConnection | null = null;

    private connection: amqp.ChannelModel | null = null;
    private channel: amqp.Channel | null = null;
    private confirmChannel: amqp.ConfirmChannel | null = null;
    private readonly config: IRabbitMQConfig;
    private reconnectAttempts = 0;
    private isReconnecting = false;
    private shuttingDown = false;

    private constructor(config: IRabbitMQConfig) {
        super();
        this.config = config;
    }

    /**
     * Get singleton instance
     */
    public static getInstance(config?: Partial<IRabbitMQConfig>): RabbitMQConnection {
        RabbitMQConnection.instance ??= new RabbitMQConnection({
            ...defaultRabbitMQConfig,
            ...config
        });
        return RabbitMQConnection.instance;
    }

    /**
     * Establish connection to RabbitMQ
     */
    async connect(): Promise<void> {
        if (this.connection && this.channel) {
            console.log('[RABBITMQ] Already connected');
            return;
        }

        try {
            console.log(`[RABBITMQ] Connecting to ${this.config.url}...`);

            this.connection = await amqp.connect(this.config.url);

            // Create regular channel
            this.channel = await this.connection.createChannel();
            await this.channel.prefetch(this.config.prefetchCount);

            // Create confirm channel for reliable publishing
            this.confirmChannel = await this.connection.createConfirmChannel();

            // Setup exchange
            await this.setupExchange();

            // Setup event handlers
            this.setupConnectionHandlers();

            this.reconnectAttempts = 0;
            console.log('[RABBITMQ] Connected successfully');
            this.emit('connected');

        } catch (error) {
            console.error('[RABBITMQ] Connection failed:', error);
            await this.handleReconnect();
        }
    }

    /**
     * Disconnect from RabbitMQ
     */
    async disconnect(): Promise<void> {
        this.shuttingDown = true;

        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }

            if (this.confirmChannel) {
                await this.confirmChannel.close();
                this.confirmChannel = null;
            }

            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            console.log('[RABBITMQ] Disconnected');
            this.emit('disconnected');

        } catch (error) {
            console.error('[RABBITMQ] Disconnect error:', error);
        }
    }

    /**
     * Get regular channel
     */
    getChannel(): amqp.Channel | null {
        return this.channel;
    }

    /**
     * Get confirm channel for reliable publishing
     */
    getConfirmChannel(): amqp.ConfirmChannel | null {
        return this.confirmChannel;
    }

    /**
     * Check connection status
     */
    isConnected(): boolean {
        return this.connection !== null && this.channel !== null;
    }

    /**
     * Get config
     */
    getConfig(): IRabbitMQConfig {
        return this.config;
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Setup the main exchange
     */
    private async setupExchange(): Promise<void> {
        if (!this.channel) return;

        // Main events exchange
        await this.channel.assertExchange(
            this.config.exchange,
            this.config.exchangeType,
            { durable: true }
        );

        // Dead letter exchange
        await this.channel.assertExchange(
            `${this.config.exchange}.dlx`,
            'fanout',
            { durable: true }
        );

        // Dead letter queue
        await this.channel.assertQueue(
            `${this.config.exchange}.dead-letter`,
            { durable: true }
        );

        await this.channel.bindQueue(
            `${this.config.exchange}.dead-letter`,
            `${this.config.exchange}.dlx`,
            ''
        );

        console.log(`[RABBITMQ] Exchange '${this.config.exchange}' ready`);
    }

    /**
     * Setup connection event handlers
     */
    private setupConnectionHandlers(): void {
        if (!this.connection) return;

        this.connection.on('error', (error) => {
            console.error('[RABBITMQ] Connection error:', error);
            this.emit('error', error);
        });

        this.connection.on('close', () => {
            if (!this.shuttingDown) {
                console.warn('[RABBITMQ] Connection closed unexpectedly');
                this.handleReconnect();
            }
        });

        if (this.channel) {
            this.channel.on('error', (error) => {
                console.error('[RABBITMQ] Channel error:', error);
            });

            this.channel.on('close', () => {
                if (!this.shuttingDown) {
                    console.warn('[RABBITMQ] Channel closed');
                }
            });
        }
    }

    /**
     * Handle reconnection with exponential backoff
     */
    private async handleReconnect(): Promise<void> {
        if (this.isReconnecting || this.shuttingDown) return;

        this.isReconnecting = true;
        this.connection = null;
        this.channel = null;
        this.confirmChannel = null;

        if (this.reconnectAttempts >= this.config.maxRetries) {
            console.error(`[RABBITMQ] Max reconnect attempts (${this.config.maxRetries}) reached`);
            this.emit('maxRetriesReached');
            this.isReconnecting = false;
            return;
        }

        this.reconnectAttempts++;
        const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[RABBITMQ] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxRetries})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        this.isReconnecting = false;
        await this.connect();
    }

    /**
     * Reset singleton (for testing)
     */
    public static reset(): void {
        if (RabbitMQConnection.instance) {
            RabbitMQConnection.instance.disconnect();
        }
        RabbitMQConnection.instance = null;
    }
}
