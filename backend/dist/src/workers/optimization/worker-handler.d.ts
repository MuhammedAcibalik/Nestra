/**
 * Optimization Worker Handler
 * Handles incoming optimization tasks and executes algorithms
 * Following SRP - Only handles message processing for optimization
 */
import { IWorkerTask, IWorkerResult, IOptimization1DPayload, IOptimization2DPayload } from '../pool/worker-task';
import { Optimization1DResult } from '../../algorithms/1d/cutting1d';
import { Optimization2DResult } from '../../algorithms/2d/cutting2d';
export declare class OptimizationWorkerHandler {
    handleTask(task: IWorkerTask<IOptimization1DPayload | IOptimization2DPayload>): IWorkerResult<Optimization1DResult | Optimization2DResult | null>;
    private run1DOptimization;
    private run2DOptimization;
}
//# sourceMappingURL=worker-handler.d.ts.map