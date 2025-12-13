"use strict";
/**
 * Event Handler Adapter
 * Bridges message bus with event handlers
 * Enables seamless switching between in-memory and RabbitMQ
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventAdapter = getEventAdapter;
exports.resetEventAdapter = resetEventAdapter;
const messaging_1 = require("../messaging");
// ==================== ADAPTER IMPLEMENTATION ====================
/**
 * Event Handler Adapter
 * Provides unified interface for both RabbitMQ and in-memory event handling
 */
class EventHandlerAdapter {
    subscriber = null;
    publisher = null;
    /**
     * Get cached subscriber instance
     */
    getSubscriber() {
        this.subscriber ??= (0, messaging_1.getMessageBus)().subscriber;
        return this.subscriber;
    }
    /**
     * Get cached publisher instance
     */
    getPublisher() {
        this.publisher ??= (0, messaging_1.getMessageBus)().publisher;
        return this.publisher;
    }
    /**
     * Subscribe to an event type
     */
    subscribe(eventType, handler) {
        this.getSubscriber().subscribe(eventType, handler);
    }
    /**
     * Publish a single event
     */
    async publish(event) {
        await this.getPublisher().publish(event);
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
     * Reset cached instances (for testing)
     */
    reset() {
        this.subscriber = null;
        this.publisher = null;
    }
}
// ==================== SINGLETON INSTANCE ====================
let adapterInstance = null;
function getEventAdapter() {
    adapterInstance ??= new EventHandlerAdapter();
    return adapterInstance;
}
function resetEventAdapter() {
    if (adapterInstance) {
        adapterInstance.reset();
    }
    adapterInstance = null;
}
//# sourceMappingURL=event-adapter.js.map