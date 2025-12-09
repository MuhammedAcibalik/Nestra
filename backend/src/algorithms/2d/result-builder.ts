/**
 * 2D Result Builder
 * Transforms active sheets into final result format
 */

import { IActiveSheet, I2DAlgorithmOptions } from '../core/types';
import { calculateSheetWaste, calculate2DStatistics } from '../core/statistics-calculator';
import { I2DPieceInput } from '../core/piece-expander';

// ==================== RESULT INTERFACES ====================

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

// ==================== RESULT BUILDER ====================

export function buildResult(
    activeSheets: readonly IActiveSheet[],
    unplacedPieces: I2DPieceInput[],
    totalExpandedPieces: number,
    _options: I2DAlgorithmOptions
): I2DOptimizationResult {
    const sheetResults: ISheetCuttingResult[] = [];

    for (const sheet of activeSheets) {
        const { wasteArea, wastePercentage, usedArea } = calculateSheetWaste(sheet);

        sheetResults.push({
            stockId: sheet.stockId,
            stockWidth: sheet.width,
            stockHeight: sheet.height,
            placements: sheet.placements.map(p => ({
                pieceId: p.pieceId,
                orderItemId: p.orderItemId,
                x: p.x,
                y: p.y,
                width: p.width,
                height: p.height,
                rotated: p.rotated
            })),
            wasteArea,
            wastePercentage,
            usedArea
        });
    }

    const unplacedCount = unplacedPieces.reduce((sum, p) => sum + p.quantity, 0);
    const placedCount = totalExpandedPieces - unplacedCount;
    const stats = calculate2DStatistics(activeSheets, placedCount);

    return {
        success: unplacedPieces.length === 0,
        sheets: sheetResults,
        totalWasteArea: stats.totalWasteArea,
        totalWastePercentage: stats.wastePercentage,
        stockUsedCount: sheetResults.length,
        unplacedPieces,
        statistics: {
            totalPieces: stats.totalPieces,
            totalStockArea: stats.totalStockArea,
            totalUsedArea: stats.totalUsedArea,
            efficiency: stats.efficiency
        }
    };
}
