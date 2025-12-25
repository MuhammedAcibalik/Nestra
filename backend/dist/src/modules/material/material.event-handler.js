"use strict";
/**
 * Material Event Handlers
 * Handles events from other modules that require material operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialEventHandler = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('MaterialEventHandler');
class MaterialEventHandler {
    materialRepository;
    constructor(materialRepository) {
        this.materialRepository = materialRepository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle stock created - validate material type
        adapter.subscribe(events_1.EventTypes.STOCK_CREATED, this.handleStockCreated.bind(this));
        // Handle low stock alert - may trigger reorder
        adapter.subscribe(events_1.EventTypes.STOCK_LOW_ALERT, this.handleLowStockAlert.bind(this));
        logger.info('Event handlers registered');
    }
    /**
     * Handle stock created - validate material type exists
     */
    async handleStockCreated(event) {
        const payload = event.payload;
        try {
            const material = await this.materialRepository.findById(payload.materialTypeId);
            if (!material) {
                logger.warn('Stock created with unknown material type', { materialTypeId: payload.materialTypeId });
            }
        }
        catch (error) {
            logger.error('Error handling stock creation', { error });
        }
    }
    /**
     * Handle low stock alert - could trigger reorder notifications
     */
    async handleLowStockAlert(event) {
        const payload = event.payload;
        try {
            logger.info('Low stock alert', { stockItemId: payload.stockItemId, currentQuantity: payload.currentQuantity });
            // Could trigger reorder workflow or notifications
        }
        catch (error) {
            logger.error('Error handling low stock alert', { error });
        }
    }
}
exports.MaterialEventHandler = MaterialEventHandler;
//# sourceMappingURL=material.event-handler.js.map