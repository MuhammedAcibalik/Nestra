"use strict";
/**
 * Production Event Handlers
 * Handles events from other modules that require production operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionEventHandler = void 0;
const events_1 = require("../../core/events");
class ProductionEventHandler {
    productionRepository;
    constructor(productionRepository) {
        this.productionRepository = productionRepository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle plan approved - start production
        adapter.subscribe(events_1.EventTypes.PLAN_APPROVED, this.handlePlanApproved.bind(this));
        // Handle stock consumed - update production progress
        adapter.subscribe(events_1.EventTypes.STOCK_CONSUMED, this.handleStockConsumed.bind(this));
        console.log('[EVENT] Production event handlers registered');
    }
    /**
     * Handle plan approved - may trigger production start
     */
    async handlePlanApproved(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        try {
            console.log(`[PRODUCTION EVENT] Plan approved: ${payload.planId}`);
            // Publish production started event with correct payload
            await adapter.publish(events_1.DomainEvents.productionStarted({
                logId: `log_${Date.now()}`,
                planId: payload.planId,
                planNumber: payload.planNumber ?? 'unknown',
                operatorId: payload.approvedById ?? 'system'
            }));
        }
        catch (error) {
            console.error('[PRODUCTION EVENT] Error handling plan approval:', error);
        }
    }
    /**
     * Handle stock consumed - update production progress
     */
    async handleStockConsumed(event) {
        const payload = event.payload;
        try {
            console.log(`[PRODUCTION EVENT] Stock consumed: ${payload.stockItemId} x ${payload.quantity}`);
            // Update production progress metrics
        }
        catch (error) {
            console.error('[PRODUCTION EVENT] Error handling stock consumption:', error);
        }
    }
}
exports.ProductionEventHandler = ProductionEventHandler;
//# sourceMappingURL=production.event-handler.js.map