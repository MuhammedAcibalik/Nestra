/**
 * Machine Event Handlers
 * Handles events from other modules that require machine operations
 * Following Event-Driven Architecture for loose coupling
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, getEventAdapter } from '../../core/events';
import { IMachineRepository } from './machine.repository';
import { createModuleLogger } from '../../core/logger';

const logger = createModuleLogger('MachineEventHandler');

export class MachineEventHandler {
    constructor(private readonly machineRepository: IMachineRepository) { }

    /**
     * Register all event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Handle production started - assign machine
        adapter.subscribe(EventTypes.PRODUCTION_STARTED, this.handleProductionStarted.bind(this));

        // Handle production completed - release machine
        adapter.subscribe(EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));

        logger.info('Event handlers registered');
    }

    /**
     * Handle production started - update machine status
     */
    private async handleProductionStarted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { productionRunId: string; machineId?: string };

        try {
            if (payload.machineId) {
                logger.debug('Production started on machine', { machineId: payload.machineId });
                // Could update machine status to 'in_use'
            }
        } catch (error) {
            logger.error('Error handling production start', { error });
        }
    }

    /**
     * Handle production completed - release machine
     */
    private async handleProductionCompleted(event: IDomainEvent): Promise<void> {
        const payload = event.payload as { productionRunId: string; machineId?: string };

        try {
            if (payload.machineId) {
                logger.debug('Production completed, releasing machine', { machineId: payload.machineId });
                // Could update machine status to 'available'
            }
        } catch (error) {
            logger.error('Error handling production completion', { error });
        }
    }
}
