"use strict";
/**
 * Stock Module Adapter
 * Implements contract interface for external access
 * This is the public API surface of the Stock module
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockModuleAdapter = void 0;
const events_1 = require("../../core/events");
class StockModuleAdapter {
    repository;
    moduleName = 'stock';
    version = '1.0.0';
    constructor(repository) {
        this.repository = repository;
    }
    async getStockById(id) {
        const stock = await this.repository.findById(id);
        if (!stock)
            return null;
        return this.toContract(stock);
    }
    async getAvailableStock(materialTypeId, stockType) {
        const items = await this.repository.findAll({
            materialTypeId,
            stockType: stockType,
            minQuantity: 1
        });
        return items.map(item => this.toContract(item));
    }
    async consumeStock(stockId, quantity, reason) {
        const eventBus = events_1.EventBus.getInstance();
        const correlationId = (0, events_1.generateCorrelationId)();
        // Publish consume request event
        await eventBus.publish(events_1.DomainEvents.stockConsumeRequested({
            stockItemId: stockId,
            quantity,
            reason,
            correlationId
        }));
    }
    async reserveStock(stockId, quantity, planId) {
        const eventBus = events_1.EventBus.getInstance();
        const correlationId = (0, events_1.generateCorrelationId)();
        // Publish reserve request event
        await eventBus.publish(events_1.DomainEvents.stockReserveRequested({
            stockItemId: stockId,
            quantity,
            planId,
            correlationId
        }));
    }
    /**
     * Health check for the module
     */
    async healthCheck() {
        try {
            // Simple health check - try to query
            await this.repository.findAll({ minQuantity: 0 });
            return {
                module: this.moduleName,
                status: 'healthy',
                timestamp: new Date()
            };
        }
        catch (error) {
            console.debug('[STOCK] Health check failed:', error);
            return {
                module: this.moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    }
    toContract(stock) {
        return {
            id: stock.id,
            code: stock.code,
            name: stock.name,
            materialTypeId: stock.materialTypeId,
            stockType: stock.stockType,
            thickness: stock.thickness,
            quantity: stock.quantity,
            reservedQty: stock.reservedQty,
            length: stock.length ?? undefined,
            width: stock.width ?? undefined,
            height: stock.height ?? undefined
        };
    }
}
exports.StockModuleAdapter = StockModuleAdapter;
//# sourceMappingURL=stock.module-adapter.js.map