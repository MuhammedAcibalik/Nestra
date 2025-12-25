/**
 * Order Event Handlers
 * Handles events from other modules and emits order state changes
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, OrderStatusUpdateRequestedPayload, getEventAdapter } from '../../core/events';
import { IOrderRepository } from './order.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('OrderEventHandler');

export class OrderEventHandler {
    constructor(private readonly repository: IOrderRepository) {}

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle order status update requests
        adapter.subscribe(EventTypes.ORDER_STATUS_UPDATE_REQUESTED, this.handleStatusUpdateRequested.bind(this));

        // Handle cutting job completed - may update order status
        adapter.subscribe(EventTypes.CUTTING_JOB_COMPLETED, this.handleCuttingJobCompleted.bind(this));

        // Handle production completed - may complete order
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        logger.info('Event handlers registered');
    }

    /**
     * Handle order status update request
     */
    private async handleStatusUpdateRequested(event: IDomainEvent): Promise<void> {
        const payload = event.payload as unknown as OrderStatusUpdateRequestedPayload;
        const adapter = getEventAdapter();

        try {
            const order = await this.repository.findById(payload.orderId);

            if (!order) {
                logger.error('Status update failed: order not found', { orderId: payload.orderId });
                return;
            }

            const oldStatus = order.status;
            await this.repository.updateStatus(payload.orderId, payload.newStatus);

            await adapter.publish(
                DomainEvents.orderStatusUpdated({
                    orderId: payload.orderId,
                    oldStatus,
                    newStatus: payload.newStatus,
                    correlationId: payload.correlationId
                })
            );

            logger.info('Order status updated', {
                orderId: payload.orderId,
                oldStatus,
                newStatus: payload.newStatus
            });
        } catch (error) {
            logger.error('Status update failed', { error });
        }
    }

    /**
     * Handle cutting job completed - mark orders as in planning
     */
    private async handleCuttingJobCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { jobId: string; jobNumber: string };
        logger.debug('Cutting job completed', { jobNumber: payload.jobNumber });
    }

    /**
     * Handle production completed
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { planId: string };
        logger.debug('Production completed', { planId: payload.planId });
    }
}
