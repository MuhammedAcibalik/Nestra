/**
 * Machine Event Handlers
 * Handles events from other modules that require machine operations
 * Following Event-Driven Architecture for loose coupling
 */
import { IMachineRepository } from './machine.repository';
export declare class MachineEventHandler {
    private readonly machineRepository;
    constructor(machineRepository: IMachineRepository);
    /**
     * Register all event handlers
     */
    register(): void;
    /**
     * Handle production started - update machine status
     */
    private handleProductionStarted;
    /**
     * Handle production completed - release machine
     */
    private handleProductionCompleted;
}
//# sourceMappingURL=machine.event-handler.d.ts.map