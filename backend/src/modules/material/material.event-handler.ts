/**
 * Material Event Handlers
 * Handles events from other modules that require material operations
 * Following Event-Driven Architecture for loose coupling
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, getEventAdapter } from '../../core/events';
import { IMaterialRepository } from './material.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('MaterialEventHandler');

export class MaterialEventHandler {
    constructor(private readonly materialRepository: IMaterialRepository) {}

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle stock created - validate material type
        adapter.subscribe(EventTypes.STOCK_CREATED, this.handleStockCreated.bind(this));

        // Handle low stock alert - may trigger reorder
        adapter.subscribe(EventTypes.STOCK_LOW_ALERT, this.handleLowStockAlert.bind(this));

        logger.info('Event handlers registered');
    }

    /**
     * Handle stock created - validate material type exists
     */
    private async handleStockCreated(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { stockItemId: string; materialTypeId: string };

        try {
            const material = await this.materialRepository.findById(payload.materialTypeId);
            if (!material) {
                logger.warn('Stock created with unknown material type', { materialTypeId: payload.materialTypeId });
            }
        } catch (error) {
            logger.error('Error handling stock creation', { error });
        }
    }

    /**
     * Handle low stock alert - could trigger reorder notifications
     */
    private async handleLowStockAlert(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { stockItemId: string; currentQuantity: number };

        try {
            logger.info('Low stock alert', {
                stockItemId: payload.stockItemId,
                currentQuantity: payload.currentQuantity
            });
            // Could trigger reorder workflow or notifications
        } catch (error) {
            logger.error('Error handling low stock alert', { error });
        }
    }
}
