/**
 * Production Event Handlers
 * Handles events from other modules that require production operations
 * Following Event-Driven Architecture for loose coupling
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, getEventAdapter } from '../../core/events';
import { IProductionRepository } from './production.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('ProductionEventHandler');

export class ProductionEventHandler {
    constructor(private readonly productionRepository: IProductionRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle plan approved - start production
        adapter.subscribe(EventTypes.PLAN_APPROVED, this.handlePlanApproved.bind(this));

        // Handle stock consumed - update production progress
        adapter.subscribe(EventTypes.STOCK_CONSUMED, this.handleStockConsumed.bind(this));

        logger.info('Production event handlers registered');
    }

    /**
     * Handle plan approved - may trigger production start
     */
    private async handlePlanApproved(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { planId: string; planNumber?: string; approvedById?: string };
        const adapter = getEventAdapter();

        try {
            logger.info('Plan approved', { planId: payload.planId });

            // Publish production started event with correct payload
            await adapter.publish(DomainEvents.productionStarted({
                logId: `log_${Date.now()}`,
                planId: payload.planId,
                planNumber: payload.planNumber ?? 'unknown',
                operatorId: payload.approvedById ?? 'system'
            }));

        } catch (error) {
            logger.error('Error handling plan approval', { error, planId: payload.planId });
        }
    }

    /**
     * Handle stock consumed - update production progress
     */
    private async handleStockConsumed(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { stockItemId: string; quantity: number };

        try {
            logger.debug('Stock consumed', { stockItemId: payload.stockItemId, quantity: payload.quantity });
            // Update production progress metrics
        } catch (error) {
            logger.error('Error handling stock consumption', { error });
        }
    }
}
