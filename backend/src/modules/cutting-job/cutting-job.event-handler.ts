/**
 * Cutting Job Event Handlers
 * Handles events from other modules that require cutting job operations
 * Following Event-Driven Architecture for loose coupling
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, getEventAdapter } from '../../core/events';
import { ICuttingJobRepository } from './cutting-job.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('CuttingJobEventHandler');

export class CuttingJobEventHandler {
    constructor(private readonly cuttingJobRepository: ICuttingJobRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle order created - may create cutting job
        adapter.subscribe(EventTypes.ORDER_CREATED, this.handleOrderCreated.bind(this));

        // Handle optimization completed - update job status
        adapter.subscribe(EventTypes.OPTIMIZATION_COMPLETED, this.handleOptimizationCompleted.bind(this));

        // Handle production completed - complete cutting job
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        logger.info('Event handlers registered');
    }

    /**
     * Handle order created - may trigger cutting job creation
     */
    private async handleOrderCreated(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { orderId: string };

        try {
            logger.debug('Order created event received', { orderId: payload.orderId });
            // Could auto-create cutting job based on order items
        } catch (error) {
            logger.error('Error handling order creation', { error });
        }
    }

    /**
     * Handle optimization completed - update cutting job status
     */
    private async handleOptimizationCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { scenarioId: string; planId: string };
        const adapter = getEventAdapter();

        try {
            logger.debug('Optimization completed', { planId: payload.planId });

            // Publish cutting job created event
            await adapter.publish(DomainEvents.cuttingJobCreated({
                jobId: `job_${Date.now()}`,
                jobNumber: `CJ-${Date.now()}`,
                materialTypeId: 'unknown',
                thickness: 0,
                itemCount: 0
            }));

        } catch (error) {
            logger.error('Error handling optimization completion', { error });
        }
    }

    /**
     * Handle production completed - complete cutting job
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { logId: string };
        const adapter = getEventAdapter();

        try {
            logger.debug('Production completed', { logId: payload.logId });

            await adapter.publish(DomainEvents.cuttingJobCompleted({
                jobId: `job_${Date.now()}`,
                jobNumber: `CJ-${Date.now()}`,
                planCount: 1
            }));

        } catch (error) {
            logger.error('Error handling production completion', { error });
        }
    }
}
