/**
 * Material Event Handlers
 * Handles events from other modules that require material operations
 * Following Event-Driven Architecture for loose coupling
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, getEventAdapter } from '../../core/events';
import { IMaterialRepository } from './material.repository';

export class MaterialEventHandler {
    constructor(private readonly materialRepository: IMaterialRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle stock created - validate material type
        adapter.subscribe(EventTypes.STOCK_CREATED, this.handleStockCreated.bind(this));

        // Handle low stock alert - may trigger reorder
        adapter.subscribe(EventTypes.STOCK_LOW_ALERT, this.handleLowStockAlert.bind(this));

        console.log('[EVENT] Material event handlers registered');
    }

    /**
     * Handle stock created - validate material type exists
     */
    private async handleStockCreated(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { stockItemId: string; materialTypeId: string };

        try {
            const material = await this.materialRepository.findById(payload.materialTypeId);
            if (!material) {
                console.warn(`[MATERIAL EVENT] Stock created with unknown material type: ${payload.materialTypeId}`);
            }
        } catch (error) {
            console.error('[MATERIAL EVENT] Error handling stock creation:', error);
        }
    }

    /**
     * Handle low stock alert - could trigger reorder notifications
     */
    private async handleLowStockAlert(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { stockItemId: string; currentQuantity: number };

        try {
            console.log(`[MATERIAL EVENT] Low stock alert: ${payload.stockItemId} (${payload.currentQuantity} remaining)`);
            // Could trigger reorder workflow or notifications
        } catch (error) {
            console.error('[MATERIAL EVENT] Error handling low stock alert:', error);
        }
    }
}
