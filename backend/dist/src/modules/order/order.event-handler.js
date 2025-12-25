"use strict";
/**
 * Order Event Handlers
 * Handles events from other modules and emits order state changes
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderEventHandler = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('OrderEventHandler');
class OrderEventHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle order status update requests
        adapter.subscribe(events_1.EventTypes.ORDER_STATUS_UPDATE_REQUESTED, this.handleStatusUpdateRequested.bind(this));
        // Handle cutting job completed - may update order status
        adapter.subscribe(events_1.EventTypes.CUTTING_JOB_COMPLETED, this.handleCuttingJobCompleted.bind(this));
        // Handle production completed - may complete order
        adapter.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        logger.info('Event handlers registered');
    }
    /**
     * Handle order status update request
     */
    async handleStatusUpdateRequested(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        try {
            const order = await this.repository.findById(payload.orderId);
            if (!order) {
                logger.error('Status update failed: order not found', { orderId: payload.orderId });
                return;
            }
            const oldStatus = order.status;
            await this.repository.updateStatus(payload.orderId, payload.newStatus);
            await adapter.publish(events_1.DomainEvents.orderStatusUpdated({
                orderId: payload.orderId,
                oldStatus,
                newStatus: payload.newStatus,
                correlationId: payload.correlationId
            }));
            logger.info('Order status updated', {
                orderId: payload.orderId,
                oldStatus,
                newStatus: payload.newStatus
            });
        }
        catch (error) {
            logger.error('Status update failed', { error });
        }
    }
    /**
     * Handle cutting job completed - mark orders as in planning
     */
    async handleCuttingJobCompleted(event) {
        const payload = event.payload;
        logger.debug('Cutting job completed', { jobNumber: payload.jobNumber });
    }
    /**
     * Handle production completed
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        logger.debug('Production completed', { planId: payload.planId });
    }
}
exports.OrderEventHandler = OrderEventHandler;
//# sourceMappingURL=order.event-handler.js.map