/**
 * Order Event Handlers
 * Handles events from other modules and emits order state changes
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */
import { IOrderRepository } from './order.repository';
export declare class OrderEventHandler {
    private readonly repository;
    constructor(repository: IOrderRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle order status update request
     */
    private handleStatusUpdateRequested;
    /**
     * Handle cutting job completed - mark orders as in planning
     */
    private handleCuttingJobCompleted;
    /**
     * Handle production completed
     */
    private handleProductionCompleted;
}
//# sourceMappingURL=order.event-handler.d.ts.map