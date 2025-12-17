/**
 * Production Event Handlers
 * Handles events from other modules that require production operations
 * Following Event-Driven Architecture for loose coupling
 */
import { IProductionRepository } from './production.repository';
export declare class ProductionEventHandler {
    private readonly productionRepository;
    constructor(productionRepository: IProductionRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle plan approved - may trigger production start
     */
    private handlePlanApproved;
    /**
     * Handle stock consumed - update production progress
     */
    private handleStockConsumed;
}
//# sourceMappingURL=production.event-handler.d.ts.map