/**
 * Cutting Job Event Handlers
 * Handles events from other modules that require cutting job operations
 * Following Event-Driven Architecture for loose coupling
 */
import { ICuttingJobRepository } from './cutting-job.repository';
export declare class CuttingJobEventHandler {
    private readonly cuttingJobRepository;
    constructor(cuttingJobRepository: ICuttingJobRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle order created - may trigger cutting job creation
     */
    private handleOrderCreated;
    /**
     * Handle optimization completed - update cutting job status
     */
    private handleOptimizationCompleted;
    /**
     * Handle production completed - complete cutting job
     */
    private handleProductionCompleted;
}
//# sourceMappingURL=cutting-job.event-handler.d.ts.map