/**
 * First Fit Decreasing (FFD) Algorithm
 * Places pieces in the first bar that fits
 * Following Strategy Pattern - implements I1DAlgorithm interface
 */
import { I1DAlgorithmOptions } from '../core/types';
import { I1DPieceInput } from '../core/piece-expander';
import { I1DStockInput } from '../core/stock-manager';
import { I1DOptimizationResult } from './result-builder';
/**
 * First Fit Decreasing Algorithm
 *
 * Strategy:
 * 1. Sort pieces by length (descending)
 * 2. For each piece, find the first bar that can fit it
 * 3. If no bar fits, create a new bar
 *
 * Complexity: O(n * m) where n = pieces, m = bars
 */
export declare function firstFitDecreasing(pieces: readonly I1DPieceInput[], stock: readonly I1DStockInput[], options: I1DAlgorithmOptions): I1DOptimizationResult;
export declare const FFD_ALGORITHM: {
    name: string;
    type: "1D";
    description: string;
};
//# sourceMappingURL=ffd-algorithm.d.ts.map