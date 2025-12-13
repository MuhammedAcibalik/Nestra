/**
 * Optimization Worker - Piscina Format
 * Named exports for different optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */
import { Optimization1DResult } from '../../algorithms/1d/cutting1d';
import { Optimization2DResult } from '../../algorithms/2d/cutting2d';
import { IOptimization1DPayload, IOptimization2DPayload } from '../pool/worker-task';
/**
 * Execute 1D cutting optimization
 * Named task for Piscina
 */
export declare function optimize1D(payload: IOptimization1DPayload): Optimization1DResult;
/**
 * Execute 2D cutting optimization
 * Named task for Piscina
 */
export declare function optimize2D(payload: IOptimization2DPayload): Optimization2DResult;
/**
 * Default handler for generic tasks
 * Dispatches to appropriate optimization based on type
 */
export default function handler(payload: {
    type: string;
    data: unknown;
}): unknown;
//# sourceMappingURL=optimization.worker.d.ts.map