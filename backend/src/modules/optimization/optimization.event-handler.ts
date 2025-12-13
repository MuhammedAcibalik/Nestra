/**
 * Optimization Event Handlers
 * Handles events from other modules that require optimization operations
 * Following Event-Driven Architecture for loose coupling
 * Uses EventAdapter for RabbitMQ/In-Memory abstraction
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, PlanStatusUpdateRequestedPayload, getEventAdapter } from '../../core/events';
import { IOptimizationRepository } from './optimization.repository';

export class OptimizationEventHandler {
    constructor(private readonly repository: IOptimizationRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle plan status update requests from other modules (e.g., Production)
        adapter.subscribe(EventTypes.PLAN_STATUS_UPDATE_REQUESTED, this.handlePlanStatusUpdateRequested.bind(this));

        // Handle production started - could trigger notifications
        adapter.subscribe(EventTypes.PRODUCTION_STARTED, this.handleProductionStarted.bind(this));

        // Handle production completed - update plan status
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        console.log('[EVENT] Optimization event handlers registered');
    }

    /**
     * Handle plan status update request from another module
     */
    private async handlePlanStatusUpdateRequested(event: IDomainEvent): Promise<void> {
        const payload = event.payload as unknown as PlanStatusUpdateRequestedPayload;
        const adapter = getEventAdapter();

        try {
            const plan = await this.repository.findPlanById(payload.planId);

            if (!plan) {
                console.error(`[OPTIMIZATION] Plan status update failed: plan ${payload.planId} not found`);
                return;
            }

            const oldStatus = plan.status;
            await this.repository.updatePlanStatus(payload.planId, payload.newStatus);

            await adapter.publish(DomainEvents.planStatusUpdated({
                planId: payload.planId,
                oldStatus,
                newStatus: payload.newStatus,
                correlationId: payload.correlationId
            }));

            console.log(`[OPTIMIZATION] Plan ${payload.planId} status: ${oldStatus} → ${payload.newStatus}`);

        } catch (error) {
            console.error('[OPTIMIZATION] Plan status update failed:', error);
        }
    }

    /**
     * Handle production started event
     */
    private async handleProductionStarted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { planId: string; planNumber: string };
        console.log(`[OPTIMIZATION] Production started for plan: ${payload.planNumber}`);
    }

    /**
     * Handle production completed event
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { planId: string; actualWaste: number };
        console.log(`[OPTIMIZATION] Production completed for plan: ${payload.planId}, waste: ${payload.actualWaste}`);
    }
}
