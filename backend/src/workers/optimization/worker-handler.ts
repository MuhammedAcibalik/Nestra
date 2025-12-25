/**
 * Optimization Worker Handler
 * Handles incoming optimization tasks and executes algorithms
 * Following SRP - Only handles message processing for optimization
 */

import {
    IWorkerTask,
    IWorkerResult,
    IOptimization1DPayload,
    IOptimization2DPayload,
    is1DPayload,
    is2DPayload,
    createResult
} from '../pool/worker-task';
import { firstFitDecreasing, bestFitDecreasing, Optimization1DResult } from '../../algorithms/1d/cutting1d';
import { bottomLeftFill, guillotineCutting, Optimization2DResult } from '../../algorithms/2d/cutting2d';

// ==================== HANDLER CLASS ====================

export class OptimizationWorkerHandler {
    handleTask(
        task: IWorkerTask<IOptimization1DPayload | IOptimization2DPayload>
    ): IWorkerResult<Optimization1DResult | Optimization2DResult | null> {
        const startTime = Date.now();

        try {
            if (task.type === 'OPTIMIZATION_1D' && is1DPayload(task.payload)) {
                const result = this.run1DOptimization(task.payload);
                return createResult(task.id, true, result, undefined, startTime);
            }

            if (task.type === 'OPTIMIZATION_2D' && is2DPayload(task.payload)) {
                const result = this.run2DOptimization(task.payload);
                return createResult(task.id, true, result, undefined, startTime);
            }

            return createResult<null>(task.id, false, null, `Unknown task type: ${task.type}`, startTime);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[WORKER] Task ${task.id} failed:`, error);
            return createResult<null>(task.id, false, null, errorMessage, startTime);
        }
    }

    private run1DOptimization(payload: IOptimization1DPayload): Optimization1DResult {
        const { pieces, stockBars, options } = payload;

        if (options.algorithm === 'BFD') {
            return bestFitDecreasing(pieces, stockBars, options);
        }
        return firstFitDecreasing(pieces, stockBars, options);
    }

    private run2DOptimization(payload: IOptimization2DPayload): Optimization2DResult {
        const { pieces, stockSheets, options } = payload;

        if (options.algorithm === 'GUILLOTINE') {
            return guillotineCutting(pieces, stockSheets, options);
        }
        return bottomLeftFill(pieces, stockSheets, options);
    }
}
