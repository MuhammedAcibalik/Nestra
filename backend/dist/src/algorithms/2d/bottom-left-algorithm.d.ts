/**
 * Bottom-Left Fill Algorithm
 * Places pieces at the lowest, leftmost available position
 */
import { I2DAlgorithmOptions } from '../core/types';
import { I2DPieceInput } from '../core/piece-expander';
import { I2DStockInput } from '../core/stock-manager';
import { I2DOptimizationResult } from './result-builder';
/**
 * Bottom-Left Fill Algorithm
 *
 * Strategy:
 * 1. Sort pieces by area (descending)
 * 2. For each piece, find the bottom-left position that fits
 * 3. If no position fits, create a new sheet
 */
export declare function bottomLeftFill(pieces: readonly I2DPieceInput[], stock: readonly I2DStockInput[], options: I2DAlgorithmOptions): I2DOptimizationResult;
export declare const BOTTOM_LEFT_ALGORITHM: {
    name: string;
    type: "2D";
    description: string;
};
//# sourceMappingURL=bottom-left-algorithm.d.ts.map