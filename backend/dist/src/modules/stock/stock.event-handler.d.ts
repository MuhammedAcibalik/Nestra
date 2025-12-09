/**
 * Stock Event Handlers
 * Handles events from other modules that require stock operations
 * Following Event-Driven Architecture for loose coupling
 */
import { IStockRepository } from './stock.repository';
export declare class StockEventHandler {
    private readonly stockRepository;
    constructor(stockRepository: IStockRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle stock consume request from another module
     * Publishes STOCK_CONSUME_COMPLETED or STOCK_CONSUME_FAILED
     */
    private handleConsumeRequested;
    /**
     * Handle stock reserve request from optimization module
     */
    private handleReserveRequested;
    /**
     * Handle production completed - check for alerts
     */
    private handleProductionCompleted;
    /**
     * Unregister handlers (for testing)
     */
    unregister(): void;
}
//# sourceMappingURL=stock.event-handler.d.ts.map