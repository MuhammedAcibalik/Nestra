"use strict";
/**
 * Order Event Handlers
 * Handles events from other modules and emits order state changes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEventHandler = void 0;
const events_1 = require("../../core/events");
class OrderEventHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const eventBus = events_1.EventBus.getInstance();
        // Handle order status update requests
        eventBus.subscribe(events_1.EventTypes.ORDER_STATUS_UPDATE_REQUESTED, this.handleStatusUpdateRequested.bind(this));
        // Handle cutting job completed - may update order status
        eventBus.subscribe(events_1.EventTypes.CUTTING_JOB_COMPLETED, this.handleCuttingJobCompleted.bind(this));
        // Handle production completed - may complete order
        eventBus.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        console.log('[EVENT] Order event handlers registered');
    }
    /**
     * Handle order status update request
     */
    async handleStatusUpdateRequested(event) {
        const payload = event.payload;
        const eventBus = events_1.EventBus.getInstance();
        try {
            const order = await this.repository.findById(payload.orderId);
            if (!order) {
                console.error(`[ORDER] Status update failed: order ${payload.orderId} not found`);
                return;
            }
            const oldStatus = order.status;
            await this.repository.updateStatus(payload.orderId, payload.newStatus);
            await eventBus.publish(events_1.DomainEvents.orderStatusUpdated({
                orderId: payload.orderId,
                oldStatus,
                newStatus: payload.newStatus,
                correlationId: payload.correlationId
            }));
            console.log(`[ORDER] Order ${payload.orderId} status: ${oldStatus} → ${payload.newStatus}`);
        }
        catch (error) {
            console.error('[ORDER] Status update failed:', error);
        }
    }
    /**
     * Handle cutting job completed - mark orders as in planning
     */
    async handleCuttingJobCompleted(event) {
        const payload = event.payload;
        console.log(`[ORDER] Cutting job completed: ${payload.jobNumber}`);
    }
    /**
     * Handle production completed
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        console.log(`[ORDER] Production completed for plan: ${payload.planId}`);
    }
    /**
     * Unregister handlers (for testing)
     */
    unregister() {
        const eventBus = events_1.EventBus.getInstance();
        eventBus.unsubscribe(events_1.EventTypes.ORDER_STATUS_UPDATE_REQUESTED);
        eventBus.unsubscribe(events_1.EventTypes.CUTTING_JOB_COMPLETED);
        eventBus.unsubscribe(events_1.EventTypes.PRODUCTION_COMPLETED);
    }
}
exports.OrderEventHandler = OrderEventHandler;
//# sourceMappingURL=order.event-handler.js.map