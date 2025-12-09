/**
 * Best Fit Decreasing (BFD) Algorithm
 * Places pieces in the bar that leaves minimum remaining space
 * Following Strategy Pattern - implements I1DAlgorithm interface
 */
import { I1DAlgorithmOptions } from '../core/types';
import { I1DPieceInput } from '../core/piece-expander';
import { I1DStockInput } from '../core/stock-manager';
import { I1DOptimizationResult } from './result-builder';
/**
 * Best Fit Decreasing Algorithm
 *
 * Strategy:
 * 1. Sort pieces by length (descending)
 * 2. For each piece, find the bar with minimum remaining space after placement
 * 3. If no bar fits, create a new bar from smallest suitable stock
 *
 * Produces less waste than FFD but requires more computation
 * Complexity: O(n * m) where n = pieces, m = bars
 */
export declare function bestFitDecreasing(pieces: readonly I1DPieceInput[], stock: readonly I1DStockInput[], options: I1DAlgorithmOptions): I1DOptimizationResult;
export declare const BFD_ALGORITHM: {
    name: string;
    type: "1D";
    description: string;
};
//# sourceMappingURL=bfd-algorithm.d.ts.map