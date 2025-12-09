/**
 * Guillotine Cutting Algorithm
 * Splits sheets using guillotine cuts (full-length horizontal/vertical cuts)
 */
import { I2DAlgorithmOptions } from '../core/types';
import { I2DPieceInput } from '../core/piece-expander';
import { I2DStockInput } from '../core/stock-manager';
import { I2DOptimizationResult } from './result-builder';
/**
 * Guillotine Cutting Algorithm
 *
 * Strategy:
 * 1. Sort pieces by area (descending)
 * 2. Track free rectangles in each sheet
 * 3. Use best short side fit for placement
 * 4. Split remaining area with guillotine cuts
 */
export declare function guillotineCutting(pieces: readonly I2DPieceInput[], stock: readonly I2DStockInput[], options: I2DAlgorithmOptions): I2DOptimizationResult;
export declare const GUILLOTINE_ALGORITHM: {
    name: string;
    type: "2D";
    description: string;
};
//# sourceMappingURL=guillotine-algorithm.d.ts.map