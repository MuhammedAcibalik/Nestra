/**
 * Optimization RabbitMQ Consumer
 * Listens for optimization requests via message bus
 * Following Event-Driven Microservice Pattern
 */
import { OptimizationEngine } from './optimization.engine';
export interface OptimizationRequestPayload {
    cuttingJobId: string;
    scenarioId: string;
    algorithm?: string;
    kerf?: number;
    allowRotation?: boolean;
    correlationId: string;
}
export declare class OptimizationConsumer {
    private readonly engine;
    constructor(engine: OptimizationEngine);
    /**
     * Register event handlers
     */
    register(): void;
    /**
     * Handle incoming optimization request
     */
    private handleOptimizationRequest;
    /**
     * Map algorithm string to typed enum
     */
    private mapAlgorithm;
}
//# sourceMappingURL=optimization.consumer.d.ts.map