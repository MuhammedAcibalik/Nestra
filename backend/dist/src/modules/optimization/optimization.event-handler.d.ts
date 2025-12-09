/**
 * Optimization Event Handlers
 * Handles events from other modules that require optimization operations
 * Following Event-Driven Architecture for loose coupling
 */
import { IOptimizationRepository } from './optimization.repository';
export declare class OptimizationEventHandler {
    private readonly repository;
    constructor(repository: IOptimizationRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle plan status update request from another module
     */
    private handlePlanStatusUpdateRequested;
    /**
     * Handle production started event
     */
    private handleProductionStarted;
    /**
     * Handle production completed event
     */
    private handleProductionCompleted;
    /**
     * Unregister handlers (for testing)
     */
    unregister(): void;
}
//# sourceMappingURL=optimization.event-handler.d.ts.map