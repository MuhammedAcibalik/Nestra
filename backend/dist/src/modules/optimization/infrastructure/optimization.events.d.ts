/**
 * Optimization Events
 * WebSocket event emitters for optimization process
 * Following SRP - Only handles event emission
 */
export interface IOptimizationEventEmitter {
    emitStarted(scenarioId: string, scenarioName: string, cuttingJobId: string): void;
    emitProgress(scenarioId: string, progress: number, message: string): void;
    emitCompleted(scenarioId: string, planId: string, planNumber: string, totalWaste: number, wastePercentage: number, stockUsedCount: number): void;
    emitFailed(scenarioId: string, error: string): void;
}
export declare class OptimizationEventEmitter implements IOptimizationEventEmitter {
    emitStarted(scenarioId: string, scenarioName: string, cuttingJobId: string): void;
    emitProgress(scenarioId: string, progress: number, message: string): void;
    emitCompleted(scenarioId: string, planId: string, planNumber: string, totalWaste: number, wastePercentage: number, stockUsedCount: number): void;
    emitFailed(scenarioId: string, error: string): void;
}
export declare const optimizationEventEmitter: OptimizationEventEmitter;
//# sourceMappingURL=optimization.events.d.ts.map