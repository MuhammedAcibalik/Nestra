"use strict";
/**
 * Machine Event Handlers
 * Handles events from other modules that require machine operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineEventHandler = void 0;
const events_1 = require("../../core/events");
class MachineEventHandler {
    machineRepository;
    constructor(machineRepository) {
        this.machineRepository = machineRepository;
    }
    /**
     * Register all event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Handle production started - assign machine
        adapter.subscribe(events_1.EventTypes.PRODUCTION_STARTED, this.handleProductionStarted.bind(this));
        // Handle production completed - release machine
        adapter.subscribe(events_1.EventTypes.PRODUCTION_COMPLETED, this.handleProductionCompleted.bind(this));
        console.log('[EVENT] Machine event handlers registered');
    }
    /**
     * Handle production started - update machine status
     */
    async handleProductionStarted(event) {
        const payload = event.payload;
        try {
            if (payload.machineId) {
                console.log(`[MACHINE EVENT] Production started on machine: ${payload.machineId}`);
                // Could update machine status to 'in_use'
            }
        }
        catch (error) {
            console.error('[MACHINE EVENT] Error handling production start:', error);
        }
    }
    /**
     * Handle production completed - release machine
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        try {
            if (payload.machineId) {
                console.log(`[MACHINE EVENT] Production completed, releasing machine: ${payload.machineId}`);
                // Could update machine status to 'available'
            }
        }
        catch (error) {
            console.error('[MACHINE EVENT] Error handling production completion:', error);
        }
    }
}
exports.MachineEventHandler = MachineEventHandler;
//# sourceMappingURL=machine.event-handler.js.map