/**
 * Optimization Events
 * WebSocket event emitters for optimization process
 * Following SRP - Only handles event emission
 */

import { websocketService } from '../../../websocket';

export interface IOptimizationEventEmitter {
    emitStarted(scenarioId: string, scenarioName: string, cuttingJobId: string): void;
    emitProgress(scenarioId: string, progress: number, message: string): void;
    emitCompleted(
        scenarioId: string,
        planId: string,
        planNumber: string,
        totalWaste: number,
        wastePercentage: number,
        stockUsedCount: number
    ): void;
    emitFailed(scenarioId: string, error: string): void;
}

export class OptimizationEventEmitter implements IOptimizationEventEmitter {
    emitStarted(scenarioId: string, scenarioName: string, cuttingJobId: string): void {
        websocketService.emitOptimizationStarted({
            scenarioId,
            scenarioName,
            cuttingJobId,
            startedAt: new Date()
        });
    }

    emitProgress(scenarioId: string, progress: number, message: string): void {
        websocketService.emitOptimizationProgress({
            scenarioId,
            progress,
            message
        });
    }

    emitCompleted(
        scenarioId: string,
        planId: string,
        planNumber: string,
        totalWaste: number,
        wastePercentage: number,
        stockUsedCount: number
    ): void {
        websocketService.emitOptimizationCompleted({
            scenarioId,
            planId,
            planNumber,
            totalWaste,
            wastePercentage,
            stockUsedCount,
            completedAt: new Date()
        });
    }

    emitFailed(scenarioId: string, error: string): void {
        websocketService.emitOptimizationFailed({
            scenarioId,
            error,
            failedAt: new Date()
        });
    }
}

export const optimizationEventEmitter = new OptimizationEventEmitter();
