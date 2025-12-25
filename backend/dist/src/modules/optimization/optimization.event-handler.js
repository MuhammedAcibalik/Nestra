"use strict";
/**
 * Optimization Event Handlers
 * Handles events from other modules that require optimization operations
 * Following Event-Driven Architecture for loose coupling
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationEventHandler = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('OptimizationEventHandler');
class OptimizationEventHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle plan status update requests from other modules (e.g., Production)
        adapter.subscribe(events_1.EventTypes.PLAN_STATUS_UPDATE_REQUESTED, this.handlePlanStatusUpdateRequested.bind(this));
        // Handle production started - could trigger notifications
        adapter.subscribe(events_1.EventTypes.PRODUCTION_STARTED, this.handleProductionStarted.bind(this));
        // Handle production completed - update plan status
        adapter.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        logger.info('Event handlers registered');
    }
    /**
     * Handle plan status update request from another module
     */
    async handlePlanStatusUpdateRequested(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        try {
            const plan = await this.repository.findPlanById(payload.planId);
            if (!plan) {
                logger.error('Plan status update failed: plan not found', { planId: payload.planId });
                return;
            }
            const oldStatus = plan.status;
            await this.repository.updatePlanStatus(payload.planId, payload.newStatus);
            await adapter.publish(events_1.DomainEvents.planStatusUpdated({
                planId: payload.planId,
                oldStatus,
                newStatus: payload.newStatus,
                correlationId: payload.correlationId
            }));
            logger.info('Plan status updated', {
                planId: payload.planId,
                oldStatus,
                newStatus: payload.newStatus
            });
        }
        catch (error) {
            logger.error('Plan status update failed', { error });
        }
    }
    /**
     * Handle production started event
     */
    async handleProductionStarted(event) {
        const payload = event.payload;
        logger.debug('Production started', { planNumber: payload.planNumber });
    }
    /**
     * Handle production completed event
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        logger.debug('Production completed', { planId: payload.planId, actualWaste: payload.actualWaste });
    }
}
exports.OptimizationEventHandler = OptimizationEventHandler;
//# sourceMappingURL=optimization.event-handler.js.map