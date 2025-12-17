/**
 * Material Event Handlers
 * Handles events from other modules that require material operations
 * Following Event-Driven Architecture for loose coupling
 */
import { IMaterialRepository } from './material.repository';
export declare class MaterialEventHandler {
    private readonly materialRepository;
    constructor(materialRepository: IMaterialRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle stock created - validate material type exists
     */
    private handleStockCreated;
    /**
     * Handle low stock alert - could trigger reorder notifications
     */
    private handleLowStockAlert;
}
//# sourceMappingURL=material.event-handler.d.ts.map