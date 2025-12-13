"use strict";
/**
 * Optimization Worker Handler
 * Handles incoming optimization tasks and executes algorithms
 * Following SRP - Only handles message processing for optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationWorkerHandler = void 0;
const worker_task_1 = require("../pool/worker-task");
const cutting1d_1 = require("../../algorithms/1d/cutting1d");
const cutting2d_1 = require("../../algorithms/2d/cutting2d");
// ==================== HANDLER CLASS ====================
class OptimizationWorkerHandler {
    handleTask(task) {
        const startTime = Date.now();
        try {
            if (task.type === 'OPTIMIZATION_1D' && (0, worker_task_1.is1DPayload)(task.payload)) {
                const result = this.run1DOptimization(task.payload);
                return (0, worker_task_1.createResult)(task.id, true, result, undefined, startTime);
            }
            if (task.type === 'OPTIMIZATION_2D' && (0, worker_task_1.is2DPayload)(task.payload)) {
                const result = this.run2DOptimization(task.payload);
                return (0, worker_task_1.createResult)(task.id, true, result, undefined, startTime);
            }
            return (0, worker_task_1.createResult)(task.id, false, null, `Unknown task type: ${task.type}`, startTime);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`[WORKER] Task ${task.id} failed:`, error);
            return (0, worker_task_1.createResult)(task.id, false, null, errorMessage, startTime);
        }
    }
    run1DOptimization(payload) {
        const { pieces, stockBars, options } = payload;
        if (options.algorithm === 'BFD') {
            return (0, cutting1d_1.bestFitDecreasing)(pieces, stockBars, options);
        }
        return (0, cutting1d_1.firstFitDecreasing)(pieces, stockBars, options);
    }
    run2DOptimization(payload) {
        const { pieces, stockSheets, options } = payload;
        if (options.algorithm === 'GUILLOTINE') {
            return (0, cutting2d_1.guillotineCutting)(pieces, stockSheets, options);
        }
        return (0, cutting2d_1.bottomLeftFill)(pieces, stockSheets, options);
    }
}
exports.OptimizationWorkerHandler = OptimizationWorkerHandler;
//# sourceMappingURL=worker-handler.js.map