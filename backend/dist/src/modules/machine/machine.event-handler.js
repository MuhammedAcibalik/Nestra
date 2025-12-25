"use strict";
/**
 * Machine Event Handlers
 * Handles events from other modules that require machine operations
 * Following Event-Driven Architecture for loose coupling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineEventHandler = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('MachineEventHandler');
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
        logger.info('Event handlers registered');
    }
    /**
     * Handle production started - update machine status
     */
    async handleProductionStarted(event) {
        const payload = event.payload;
        try {
            if (payload.machineId) {
                logger.debug('Production started on machine', { machineId: payload.machineId });
                // Could update machine status to 'in_use'
            }
        }
        catch (error) {
            logger.error('Error handling production start', { error });
        }
    }
    /**
     * Handle production completed - release machine
     */
    async handleProductionCompleted(event) {
        const payload = event.payload;
        try {
            if (payload.machineId) {
                logger.debug('Production completed, releasing machine', { machineId: payload.machineId });
                // Could update machine status to 'available'
            }
        }
        catch (error) {
            logger.error('Error handling production completion', { error });
        }
    }
}
exports.MachineEventHandler = MachineEventHandler;
//# sourceMappingURL=machine.event-handler.js.map