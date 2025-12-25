"use strict";
/**
 * Cutting Job Event Handlers
 * Handles events from other modules that require cutting job operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuttingJobEventHandler = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('CuttingJobEventHandler');
class CuttingJobEventHandler {
    cuttingJobRepository;
    constructor(cuttingJobRepository) {
        this.cuttingJobRepository = cuttingJobRepository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle order created - may create cutting job
        adapter.subscribe(events_1.EventTypes.ORDER_CREATED, this.handleOrderCreated.bind(this));
        // Handle optimization completed - update job status
        adapter.subscribe(events_1.EventTypes.OPTIMIZATION_COMPLETED, this.handleOptimizationCompleted.bind(this));
        // Handle production completed - complete cutting job
        adapter.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        logger.info('Event handlers registered');
    }
    /**
     * Handle order created - may trigger cutting job creation
     */
    async handleOrderCreated(event) {
        const payload = event.payload;
        try {
            logger.debug('Order created event received', { orderId: payload.orderId });
            // Could auto-create cutting job based on order items
        }
        catch (error) {
            logger.error('Error handling order creation', { error });
        }
    }
    /**
     * Handle optimization completed - update cutting job status
     */
    async handleOptimizationCompleted(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        try {
            logger.debug('Optimization completed', { planId: payload.planId });
            // Publish cutting job created event
            await adapter.publish(events_1.DomainEvents.cuttingJobCreated({
                jobId: `job_${Date.now()}`,
                jobNumber: `CJ-${Date.now()}`,
                materialTypeId: 'unknown',
                thickness: 0,
                itemCount: 0
            }));
        }
        catch (error) {
            logger.error('Error handling optimization completion', { error });
        }
    }
    /**
     * Handle production completed - complete cutting job
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        try {
            logger.debug('Production completed', { logId: payload.logId });
            await adapter.publish(events_1.DomainEvents.cuttingJobCompleted({
                jobId: `job_${Date.now()}`,
                jobNumber: `CJ-${Date.now()}`,
                planCount: 1
            }));
        }
        catch (error) {
            logger.error('Error handling production completion', { error });
        }
    }
}
exports.CuttingJobEventHandler = CuttingJobEventHandler;
//# sourceMappingURL=cutting-job.event-handler.js.map