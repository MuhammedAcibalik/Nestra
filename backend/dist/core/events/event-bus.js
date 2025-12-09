"use strict";
/**
 * Event Bus - In-Memory Implementation
 * Following Singleton Pattern for global event handling
 * Enables loose coupling between modules (microservices communication)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
exports.createDomainEvent = createDomainEvent;
/**
 * In-Memory Event Bus
 * For production, this can be replaced with Redis/RabbitMQ implementation
 */
class EventBus {
    static instance;
    handlers = new Map();
    eventLog = [];
    maxLogSize = 1000;
    constructor() {
        // Private constructor for singleton
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    /**
     * Publish a single event
     */
    async publish(event) {
        // Log event
        this.logEvent(event);
        console.log(`[EVENT] ${event.eventType}: ${event.aggregateType}#${event.aggregateId}`);
        // Get handlers for this event type
        const handlers = this.handlers.get(event.eventType);
        if (!handlers || handlers.size === 0) {
            return;
        }
        // Execute all handlers (fire and forget style)
        const handlerPromises = Array.from(handlers).map(async (handler) => {
            try {
                await handler(event);
            }
            catch (error) {
                console.error(`[EVENT ERROR] Handler failed for ${event.eventType}:`, error);
            }
        });
        // Wait for all handlers to complete
        await Promise.all(handlerPromises);
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
     * Subscribe to an event type
     */
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        console.log(`[EVENT] Subscribed to: ${eventType}`);
    }
    /**
     * Unsubscribe from an event type (removes all handlers)
     */
    unsubscribe(eventType) {
        this.handlers.delete(eventType);
        console.log(`[EVENT] Unsubscribed from: ${eventType}`);
    }
    /**
     * Unsubscribe a specific handler
     */
    unsubscribeHandler(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    /**
     * Get all registered event types
     */
    getRegisteredEventTypes() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get recent events (for debugging/monitoring)
     */
    getRecentEvents(count = 10) {
        return this.eventLog.slice(-count);
    }
    /**
     * Clear event log
     */
    clearEventLog() {
        this.eventLog = [];
    }
    /**
     * Log event with size limit
     */
    logEvent(event) {
        this.eventLog.push(event);
        if (this.eventLog.length > this.maxLogSize) {
            this.eventLog = this.eventLog.slice(-this.maxLogSize);
        }
    }
    /**
     * Reset singleton (for testing)
     */
    static reset() {
        if (EventBus.instance) {
            EventBus.instance.handlers.clear();
            EventBus.instance.eventLog = [];
        }
        EventBus.instance = undefined;
    }
}
exports.EventBus = EventBus;
/**
 * Helper function to create domain events
 */
function createDomainEvent(eventType, aggregateType, aggregateId, payload) {
    return {
        eventId: generateEventId(),
        eventType,
        timestamp: new Date(),
        aggregateType,
        aggregateId,
        payload: payload
    };
}
/**
 * Generate unique event ID
 */
function generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=event-bus.js.map