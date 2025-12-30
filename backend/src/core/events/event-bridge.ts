/**
 * Event Bridge
 * Bridges local EventBus to external messaging systems (RabbitMQ)
 * Enables seamless transition from in-memory to distributed events
 */

import { IDomainEvent } from '../interfaces/event.interface';
import { EventBus } from './event-bus';
import { RabbitMQPublisher } from '../messaging/rabbitmq.publisher';
import { createModuleLogger } from '../logger';

const logger = createModuleLogger('EventBridge');

// ==================== CONFIGURATION ====================

export interface IEventBridgeConfig {
    /** Enable forwarding to RabbitMQ */
    enableExternalPublishing: boolean;
    /** Event types to forward to external systems */
    externalEventTypes: string[] | 'all';
    /** Exchange name for external events */
    exchangeName: string;
}

const DEFAULT_CONFIG: IEventBridgeConfig = {
    enableExternalPublishing: false,
    externalEventTypes: 'all',
    exchangeName: 'nestra.events'
};

// ==================== INTEGRATION EVENTS ====================

/**
 * Integration event types for external systems
 * These are events that should be published to message brokers
 */
export const IntegrationEventTypes = {
    // Order lifecycle
    ORDER_CREATED_INTEGRATION: 'integration.order.created',
    ORDER_COMPLETED_INTEGRATION: 'integration.order.completed',
    ORDER_CANCELLED_INTEGRATION: 'integration.order.cancelled',

    // Production updates
    PRODUCTION_STARTED_INTEGRATION: 'integration.production.started',
    PRODUCTION_COMPLETED_INTEGRATION: 'integration.production.completed',

    // Stock alerts
    STOCK_LOW_ALERT_INTEGRATION: 'integration.stock.low-alert',
    STOCK_DEPLETED_INTEGRATION: 'integration.stock.depleted',

    // Optimization results
    OPTIMIZATION_COMPLETED_INTEGRATION: 'integration.optimization.completed'
} as const;

// ==================== EVENT BRIDGE ====================

export class EventBridge {
    private isEnabled = false;
    private readonly config: IEventBridgeConfig;

    constructor(
        private readonly eventBus: EventBus,
        private readonly publisher: RabbitMQPublisher | null,
        config?: Partial<IEventBridgeConfig>
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Start bridging events
     */
    start(): void {
        if (!this.config.enableExternalPublishing || !this.publisher) {
            logger.info('EventBridge disabled (no external publishing configured)');
            return;
        }

        this.isEnabled = true;
        this.setupBridge();
        logger.info('EventBridge started', {
            externalEventTypes: this.config.externalEventTypes
        });
    }

    /**
     * Stop bridging events
     */
    stop(): void {
        this.isEnabled = false;
        logger.info('EventBridge stopped');
    }

    /**
     * Setup event forwarding
     */
    private setupBridge(): void {
        // Subscribe to all events and forward matching ones
        this.eventBus.subscribe('*', async (event) => {
            if (!this.isEnabled) return;
            await this.forwardToExternal(event);
        });
    }

    /**
     * Forward event to external messaging system
     */
    private async forwardToExternal(event: IDomainEvent): Promise<void> {
        // Check if this event type should be forwarded
        if (!this.shouldForward(event.eventType)) {
            return;
        }

        try {
            if (this.publisher) {
                // RabbitMQPublisher expects IDomainEvent format
                await this.publisher.publish(event);
                logger.debug('Event forwarded to external', { eventType: event.eventType });
            }
        } catch (error) {
            logger.error('Failed to forward event', {
                eventType: event.eventType,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Check if event should be forwarded
     */
    private shouldForward(eventType: string): boolean {
        if (this.config.externalEventTypes === 'all') {
            return true;
        }
        return this.config.externalEventTypes.includes(eventType);
    }

    /**
     * Convert domain event to integration event format
     */
    private toIntegrationEvent(event: IDomainEvent): IIntegrationEvent {
        return {
            id: event.eventId,
            type: event.eventType,
            source: 'nestra-backend',
            timestamp: event.timestamp.toISOString(),
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            data: event.payload,
            metadata: {
                version: '1.0',
                correlationId: (event as { correlationId?: string }).correlationId
            }
        };
    }

    /**
     * Manually publish integration event
     */
    async publishIntegration(
        eventType: string,
        aggregateType: string,
        aggregateId: string,
        data: Record<string, unknown>
    ): Promise<void> {
        if (!this.publisher) {
            logger.warn('Cannot publish integration event: no publisher configured');
            return;
        }

        // Create IDomainEvent format for RabbitMQPublisher
        const domainEvent: IDomainEvent = {
            eventId: `int_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            eventType,
            timestamp: new Date(),
            aggregateType,
            aggregateId,
            payload: data
        };

        await this.publisher.publish(domainEvent);

        logger.info('Integration event published', { eventType });
    }
}

// ==================== INTEGRATION EVENT INTERFACE ====================

export interface IIntegrationEvent {
    id: string;
    type: string;
    source: string;
    timestamp: string;
    aggregateType: string;
    aggregateId: string;
    data: Record<string, unknown>;
    metadata: {
        version: string;
        correlationId?: string;
    };
}

// ==================== SINGLETON ====================

let bridgeInstance: EventBridge | null = null;

export function initializeEventBridge(
    eventBus: EventBus,
    publisher: RabbitMQPublisher | null,
    config?: Partial<IEventBridgeConfig>
): EventBridge {
    bridgeInstance ??= new EventBridge(eventBus, publisher, config);
    return bridgeInstance;
}

export function getEventBridge(): EventBridge | null {
    return bridgeInstance;
}
