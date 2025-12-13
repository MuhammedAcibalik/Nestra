/**
 * Optimization Worker - Piscina Format
 * Named exports for different optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */

import {
    firstFitDecreasing,
    bestFitDecreasing,
    Optimization1DResult
} from '../../algorithms/1d/cutting1d';
import {
    bottomLeftFill,
    guillotineCutting,
    Optimization2DResult
} from '../../algorithms/2d/cutting2d';
import { IOptimization1DPayload, IOptimization2DPayload } from '../pool/worker-task';

// ==================== 1D OPTIMIZATION ====================

/**
 * Execute 1D cutting optimization
 * Named task for Piscina
 */
export function optimize1D(payload: IOptimization1DPayload): Optimization1DResult {
    const { pieces, stockBars, options } = payload;

    console.log(`[WORKER] 1D Optimization: ${pieces.length} pieces, ${stockBars.length} bars`);

    if (options.algorithm === 'BFD') {
        return bestFitDecreasing(pieces, stockBars, options);
    }
    return firstFitDecreasing(pieces, stockBars, options);
}

// ==================== 2D OPTIMIZATION ====================

/**
 * Execute 2D cutting optimization
 * Named task for Piscina
 */
export function optimize2D(payload: IOptimization2DPayload): Optimization2DResult {
    const { pieces, stockSheets, options } = payload;

    console.log(`[WORKER] 2D Optimization: ${pieces.length} pieces, ${stockSheets.length} sheets`);

    if (options.algorithm === 'GUILLOTINE') {
        return guillotineCutting(pieces, stockSheets, options);
    }
    return bottomLeftFill(pieces, stockSheets, options);
}

// ==================== DEFAULT EXPORT ====================

/**
 * Default handler for generic tasks
 * Dispatches to appropriate optimization based on type
 */
export default function handler(payload: { type: string; data: unknown }): unknown {
    switch (payload.type) {
        case 'OPTIMIZATION_1D':
            return optimize1D(payload.data as IOptimization1DPayload);
        case 'OPTIMIZATION_2D':
            return optimize2D(payload.data as IOptimization2DPayload);
        default:
            throw new Error(`Unknown task type: ${payload.type}`);
    }
}
