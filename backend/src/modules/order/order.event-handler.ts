/**
 * Order Event Handlers
 * Handles events from other modules and emits order state changes
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventBus, EventTypes, DomainEvents, OrderStatusUpdateRequestedPayload } from '../../core/events';
import { IOrderRepository } from './order.repository';

export class OrderEventHandler {
    constructor(private readonly repository: IOrderRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const eventBus = EventBus.getInstance();

        // Handle order status update requests
        eventBus.subscribe(EventTypes.ORDER_STATUS_UPDATE_REQUESTED, this.handleStatusUpdateRequested.bind(this));

        // Handle cutting job completed - may update order status
        eventBus.subscribe(EventTypes.CUTTING_JOB_COMPLETED, this.handleCuttingJobCompleted.bind(this));

        // Handle production completed - may complete order
        eventBus.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        console.log('[EVENT] Order event handlers registered');
    }

    /**
     * Handle order status update request
     */
    private async handleStatusUpdateRequested(event: IDomainEvent): Promise<void> {
        const payload = event.payload as unknown as OrderStatusUpdateRequestedPayload;
        const eventBus = EventBus.getInstance();

        try {
            const order = await this.repository.findById(payload.orderId);

            if (!order) {
                console.error(`[ORDER] Status update failed: order ${payload.orderId} not found`);
                return;
            }

            const oldStatus = order.status;
            await this.repository.updateStatus(payload.orderId, payload.newStatus);

            await eventBus.publish(DomainEvents.orderStatusUpdated({
                orderId: payload.orderId,
                oldStatus,
                newStatus: payload.newStatus,
                correlationId: payload.correlationId
            }));

            console.log(`[ORDER] Order ${payload.orderId} status: ${oldStatus} → ${payload.newStatus}`);

        } catch (error) {
            console.error('[ORDER] Status update failed:', error);
        }
    }

    /**
     * Handle cutting job completed - mark orders as in planning
     */
    private async handleCuttingJobCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { jobId: string; jobNumber: string };
        console.log(`[ORDER] Cutting job completed: ${payload.jobNumber}`);
    }

    /**
     * Handle production completed
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { planId: string };
        console.log(`[ORDER] Production completed for plan: ${payload.planId}`);
    }

    /**
     * Unregister handlers (for testing)
     */
    unregister(): void {
        const eventBus = EventBus.getInstance();
        eventBus.unsubscribe(EventTypes.ORDER_STATUS_UPDATE_REQUESTED);
        eventBus.unsubscribe(EventTypes.CUTTING_JOB_COMPLETED);
        eventBus.unsubscribe(EventTypes.PRODUCTION_COMPLETED);
    }
}
