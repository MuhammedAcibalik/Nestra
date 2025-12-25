"use strict";
/**
 * Optimization RabbitMQ Consumer
 * Listens for optimization requests via message bus
 * Following Event-Driven Microservice Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationConsumer = void 0;
const events_1 = require("../../core/events");
const logger_1 = require("../../core/logger");
const logger = (0, logger_1.createModuleLogger)('OptimizationConsumer');
// ==================== CONSUMER CLASS ====================
class OptimizationConsumer {
    engine;
    constructor(engine) {
        this.engine = engine;
    }
    /**
     * Register event handlers
     */
    register() {
        const adapter = (0, events_1.getEventAdapter)();
        // Listen for optimization run requests
        adapter.subscribe(events_1.EventTypes.OPTIMIZATION_RUN_REQUESTED, this.handleOptimizationRequest.bind(this));
        logger.info('Registered for optimization requests');
    }
    /**
     * Handle incoming optimization request
     */
    async handleOptimizationRequest(event) {
        const payload = event.payload;
        const adapter = (0, events_1.getEventAdapter)();
        logger.debug('Received optimization request', { cuttingJobId: payload.cuttingJobId });
        try {
            // Prepare input
            const input = {
                cuttingJobId: payload.cuttingJobId,
                scenarioId: payload.scenarioId,
                parameters: {
                    algorithm: this.mapAlgorithm(payload.algorithm),
                    kerf: payload.kerf,
                    allowRotation: payload.allowRotation
                }
            };
            // Run optimization (uses Piscina internally)
            const result = await this.engine.runOptimization(input);
            if (result.success) {
                // Publish success event
                const planNumber = `PLAN-${Date.now()}`;
                await adapter.publish(events_1.DomainEvents.optimizationCompleted({
                    scenarioId: payload.scenarioId,
                    planId: `plan_${Date.now()}`,
                    planNumber,
                    efficiency: result.planData.efficiency,
                    wastePercentage: result.planData.wastePercentage
                }));
                logger.info('Optimization completed', { correlationId: payload.correlationId });
            }
            else {
                // Publish failure event
                await adapter.publish(events_1.DomainEvents.optimizationFailed({
                    scenarioId: payload.scenarioId,
                    reason: result.error ?? 'Unknown error'
                }));
                logger.error('Optimization failed', { error: result.error });
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await adapter.publish(events_1.DomainEvents.optimizationFailed({
                scenarioId: payload.scenarioId,
                reason: errorMessage
            }));
            logger.error('Optimization consumer error', { error });
        }
    }
    /**
     * Map algorithm string to typed enum
     */
    mapAlgorithm(algo) {
        switch (algo?.toUpperCase()) {
            case '1D_FFD': return '1D_FFD';
            case '1D_BFD': return '1D_BFD';
            case '2D_BOTTOM_LEFT': return '2D_BOTTOM_LEFT';
            case '2D_GUILLOTINE': return '2D_GUILLOTINE';
            default: return undefined;
        }
    }
}
exports.OptimizationConsumer = OptimizationConsumer;
//# sourceMappingURL=optimization.consumer.js.map