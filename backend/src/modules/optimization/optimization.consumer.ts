/**
 * Optimization RabbitMQ Consumer
 * Listens for optimization requests via message bus
 * Following Event-Driven Microservice Pattern
 */

import { IDomainEvent } from '../../core/interfaces';
import { EventTypes, DomainEvents, getEventAdapter } from '../../core/events';
import { OptimizationEngine, OptimizationInput } from './optimization.engine';

// ==================== PAYLOAD TYPES ====================

export interface OptimizationRequestPayload {
    cuttingJobId: string;
    scenarioId: string;
    algorithm?: string;
    kerf?: number;
    allowRotation?: boolean;
    correlationId: string;
}

// ==================== CONSUMER CLASS ====================

export class OptimizationConsumer {
    constructor(private readonly engine: OptimizationEngine) { }

    /**
     * Register event handlers
     */
    register(): void {
        const adapter = getEventAdapter();

        // Listen for optimization run requests
        adapter.subscribe(
            EventTypes.OPTIMIZATION_RUN_REQUESTED,
            this.handleOptimizationRequest.bind(this)
        );

        console.log('[OPTIMIZATION CONSUMER] Registered for optimization requests');
    }

    /**
     * Handle incoming optimization request
     */
    private async handleOptimizationRequest(event: IDomainEvent): Promise<void> {
        const payload = event.payload as unknown as OptimizationRequestPayload;
        const adapter = getEventAdapter();

        console.log(`[OPTIMIZATION CONSUMER] Received request: ${payload.cuttingJobId}`);

        try {
            // Prepare input
            const input: OptimizationInput = {
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
                await adapter.publish(DomainEvents.optimizationCompleted({
                    scenarioId: payload.scenarioId,
                    planId: `plan_${Date.now()}`,
                    planNumber,
                    efficiency: result.planData.efficiency,
                    wastePercentage: result.planData.wastePercentage
                }));

                console.log(`[OPTIMIZATION CONSUMER] Completed: ${payload.correlationId}`);
            } else {
                // Publish failure event
                await adapter.publish(DomainEvents.optimizationFailed({
                    scenarioId: payload.scenarioId,
                    reason: result.error ?? 'Unknown error'
                }));

                console.error(`[OPTIMIZATION CONSUMER] Failed: ${result.error}`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await adapter.publish(DomainEvents.optimizationFailed({
                scenarioId: payload.scenarioId,
                reason: errorMessage
            }));

            console.error(`[OPTIMIZATION CONSUMER] Error:`, error);
        }
    }

    /**
     * Map algorithm string to typed enum
     */
    private mapAlgorithm(algo?: string): '1D_FFD' | '1D_BFD' | '2D_BOTTOM_LEFT' | '2D_GUILLOTINE' | undefined {
        switch (algo?.toUpperCase()) {
            case '1D_FFD': return '1D_FFD';
            case '1D_BFD': return '1D_BFD';
            case '2D_BOTTOM_LEFT': return '2D_BOTTOM_LEFT';
            case '2D_GUILLOTINE': return '2D_GUILLOTINE';
            default: return undefined;
        }
    }
}
