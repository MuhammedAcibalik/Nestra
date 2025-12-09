/**
 * 1D Result Builder
 * Transforms active bars into final result format
 * Single Responsibility: Only handles result construction
 */
import { IActiveBar, I1DAlgorithmOptions } from '../core/types';
import { I1DPieceInput } from '../core/piece-expander';
/**
 * Single bar result
 */
export interface IBarCuttingResult {
    stockId: string;
    stockLength: number;
    cuts: Array<{
        pieceId: string;
        orderItemId: string;
        position: number;
        length: number;
    }>;
    waste: number;
    wastePercentage: number;
    usableWaste?: {
        position: number;
        length: number;
    };
}
/**
 * Complete 1D optimization result
 */
export interface I1DOptimizationResult {
    success: boolean;
    bars: IBarCuttingResult[];
    totalWaste: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: I1DPieceInput[];
    statistics: {
        totalPieces: number;
        totalStockLength: number;
        totalUsedLength: number;
        efficiency: number;
    };
}
/**
 * Build final result from active bars
 */
export declare function buildResult(activeBars: readonly IActiveBar[], unplacedPieces: I1DPieceInput[], totalExpandedPieces: number, options: I1DAlgorithmOptions): I1DOptimizationResult;
//# sourceMappingURL=result-builder.d.ts.map