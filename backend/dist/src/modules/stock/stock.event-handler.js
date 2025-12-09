"use strict";
/**
 * Stock Event Handlers
 * Handles events from other modules that require stock operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockEventHandler = void 0;
const events_1 = require("../../core/events");
class StockEventHandler {
    stockRepository;
    constructor(stockRepository) {
        this.stockRepository = stockRepository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const eventBus = events_1.EventBus.getInstance();
        // Handle stock consume requests from other modules (e.g., Production)
        eventBus.subscribe(events_1.EventTypes.STOCK_CONSUME_REQUESTED, this.handleConsumeRequested.bind(this));
        // Handle stock reserve requests from other modules (e.g., Optimization)
        eventBus.subscribe(events_1.EventTypes.STOCK_RESERVE_REQUESTED, this.handleReserveRequested.bind(this));
        // Handle production completed - may trigger low stock alerts
        eventBus.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        console.log('[EVENT] Stock event handlers registered');
    }
    /**
     * Handle stock consume request from another module
     * Publishes STOCK_CONSUME_COMPLETED or STOCK_CONSUME_FAILED
     */
    async handleConsumeRequested(event) {
        const payload = event.payload;
        const eventBus = events_1.EventBus.getInstance();
        try {
            // Get current stock
            const stock = await this.stockRepository.findById(payload.stockItemId);
            if (!stock) {
                await eventBus.publish(events_1.DomainEvents.stockConsumeFailed({
                    stockItemId: payload.stockItemId,
                    quantity: payload.quantity,
                    reason: 'Stock item not found',
                    correlationId: payload.correlationId
                }));
                return;
            }
            if (stock.quantity < payload.quantity) {
                await eventBus.publish(events_1.DomainEvents.stockConsumeFailed({
                    stockItemId: payload.stockItemId,
                    quantity: payload.quantity,
                    reason: `Insufficient stock: ${stock.quantity} available, ${payload.quantity} requested`,
                    correlationId: payload.correlationId
                }));
                return;
            }
            // Create movement
            const movement = await this.stockRepository.createMovement({
                stockItemId: payload.stockItemId,
                movementType: 'CONSUMPTION',
                quantity: payload.quantity,
                notes: payload.reason,
                productionLogId: payload.productionLogId
            });
            // Update quantity
            await this.stockRepository.updateQuantity(payload.stockItemId, -payload.quantity);
            // Publish success
            await eventBus.publish(events_1.DomainEvents.stockConsumeCompleted({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                movementId: movement.id,
                correlationId: payload.correlationId
            }));
            // Check for low stock alert
            const updatedStock = await this.stockRepository.findById(payload.stockItemId);
            if (updatedStock && updatedStock.quantity <= 5) {
                await eventBus.publish(events_1.DomainEvents.stockLowAlert({
                    stockItemId: updatedStock.id,
                    stockCode: updatedStock.code,
                    currentQuantity: updatedStock.quantity,
                    minThreshold: 5
                }));
            }
        }
        catch (error) {
            await eventBus.publish(events_1.DomainEvents.stockConsumeFailed({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                reason: error instanceof Error ? error.message : 'Unknown error',
                correlationId: payload.correlationId
            }));
        }
    }
    /**
     * Handle stock reserve request from optimization module
     */
    async handleReserveRequested(event) {
        const payload = event.payload;
        const eventBus = events_1.EventBus.getInstance();
        try {
            const stock = await this.stockRepository.findById(payload.stockItemId);
            if (!stock) {
                console.error(`[STOCK] Reserve failed: stock ${payload.stockItemId} not found`);
                return;
            }
            const available = stock.quantity - stock.reservedQty;
            if (available < payload.quantity) {
                console.error(`[STOCK] Reserve failed: insufficient available (${available}/${payload.quantity})`);
                return;
            }
            // Update reserved quantity
            await this.stockRepository.updateQuantity(payload.stockItemId, 0, payload.quantity);
            await eventBus.publish(events_1.DomainEvents.stockReserveCompleted({
                stockItemId: payload.stockItemId,
                quantity: payload.quantity,
                planId: payload.planId,
                correlationId: payload.correlationId
            }));
        }
        catch (error) {
            console.error('[STOCK] Reserve failed:', error);
        }
    }
    /**
     * Handle production completed - check for alerts
     */
    async handleProductionCompleted(event) {
        // Log for monitoring
        console.log(`[STOCK] Production completed: ${event.aggregateId}`);
    }
    /**
     * Unregister handlers (for testing)
     */
    unregister() {
        const eventBus = events_1.EventBus.getInstance();
        eventBus.unsubscribe(events_1.EventTypes.STOCK_CONSUME_REQUESTED);
        eventBus.unsubscribe(events_1.EventTypes.STOCK_RESERVE_REQUESTED);
        eventBus.unsubscribe(events_1.EventTypes.PRODUCTION_COMPLETED);
    }
}
exports.StockEventHandler = StockEventHandler;
//# sourceMappingURL=stock.event-handler.js.map