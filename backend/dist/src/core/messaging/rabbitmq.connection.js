"use strict";
/**
 * RabbitMQ Connection Manager
 * Handles connection lifecycle, reconnection, and channel management
 * Following Microservice Pattern: Connection Resilience
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQConnection = exports.defaultRabbitMQConfig = void 0;
const amqp = __importStar(require("amqplib"));
const node_events_1 = require("node:events");
// ==================== DEFAULT CONFIG ====================
exports.defaultRabbitMQConfig = {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'nestra.events',
    exchangeType: 'topic',
    reconnectDelay: Number.parseInt(process.env.RABBITMQ_RETRY_DELAY ?? '5000', 10),
    maxRetries: Number.parseInt(process.env.RABBITMQ_MAX_RETRIES ?? '10', 10),
    prefetchCount: Number.parseInt(process.env.RABBITMQ_PREFETCH ?? '10', 10)
};
// ==================== CONNECTION MANAGER ====================
class RabbitMQConnection extends node_events_1.EventEmitter {
    static instance = null;
    connection = null;
    channel = null;
    confirmChannel = null;
    config;
    reconnectAttempts = 0;
    isReconnecting = false;
    shuttingDown = false;
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        RabbitMQConnection.instance ??= new RabbitMQConnection({
            ...exports.defaultRabbitMQConfig,
            ...config
        });
        return RabbitMQConnection.instance;
    }
    /**
     * Establish connection to RabbitMQ
     */
    async connect() {
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
        }
        catch (error) {
            console.error('[RABBITMQ] Connection failed:', error);
            await this.handleReconnect();
        }
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
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
        }
        catch (error) {
            console.error('[RABBITMQ] Disconnect error:', error);
        }
    }
    /**
     * Get regular channel
     */
    getChannel() {
        return this.channel;
    }
    /**
     * Get confirm channel for reliable publishing
     */
    getConfirmChannel() {
        return this.confirmChannel;
    }
    /**
     * Check connection status
     */
    isConnected() {
        return this.connection !== null && this.channel !== null;
    }
    /**
     * Get config
     */
    getConfig() {
        return this.config;
    }
    // ==================== PRIVATE METHODS ====================
    /**
     * Setup the main exchange
     */
    async setupExchange() {
        if (!this.channel)
            return;
        // Main events exchange
        await this.channel.assertExchange(this.config.exchange, this.config.exchangeType, { durable: true });
        // Dead letter exchange
        await this.channel.assertExchange(`${this.config.exchange}.dlx`, 'fanout', { durable: true });
        // Dead letter queue
        await this.channel.assertQueue(`${this.config.exchange}.dead-letter`, { durable: true });
        await this.channel.bindQueue(`${this.config.exchange}.dead-letter`, `${this.config.exchange}.dlx`, '');
        console.log(`[RABBITMQ] Exchange '${this.config.exchange}' ready`);
    }
    /**
     * Setup connection event handlers
     */
    setupConnectionHandlers() {
        if (!this.connection)
            return;
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
    async handleReconnect() {
        if (this.isReconnecting || this.shuttingDown)
            return;
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
    static reset() {
        if (RabbitMQConnection.instance) {
            RabbitMQConnection.instance.disconnect();
        }
        RabbitMQConnection.instance = null;
    }
}
exports.RabbitMQConnection = RabbitMQConnection;
//# sourceMappingURL=rabbitmq.connection.js.map