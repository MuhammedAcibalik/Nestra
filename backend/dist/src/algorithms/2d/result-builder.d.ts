/**
 * 2D Result Builder
 * Transforms active sheets into final result format
 */
import { IActiveSheet, I2DAlgorithmOptions } from '../core/types';
import { I2DPieceInput } from '../core/piece-expander';
export interface ISheetCuttingResult {
    stockId: string;
    stockWidth: number;
    stockHeight: number;
    placements: Array<{
        pieceId: string;
        orderItemId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotated: boolean;
    }>;
    wasteArea: number;
    wastePercentage: number;
    usedArea: number;
}
export interface I2DOptimizationResult {
    success: boolean;
    sheets: ISheetCuttingResult[];
    totalWasteArea: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: I2DPieceInput[];
    statistics: {
        totalPieces: number;
        totalStockArea: number;
        totalUsedArea: number;
        efficiency: number;
    };
}
export declare function buildResult(activeSheets: readonly IActiveSheet[], unplacedPieces: I2DPieceInput[], totalExpandedPieces: number, _options: I2DAlgorithmOptions): I2DOptimizationResult;
//# sourceMappingURL=result-builder.d.ts.map