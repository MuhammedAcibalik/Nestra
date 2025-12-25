/**
 * 1D Result Builder
 * Transforms active bars into final result format
 * Single Responsibility: Only handles result construction
 */

import { IActiveBar, I1DAlgorithmOptions } from '../core/types';
import { calculateBarWaste, calculate1DStatistics } from '../core/statistics-calculator';
import { I1DPieceInput } from '../core/piece-expander';
import { calculateUsableWaste } from './bin-manager';

// ==================== RESULT INTERFACES ====================

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
    usableWaste?: { position: number; length: number };
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

// ==================== RESULT BUILDER ====================

/**
 * Build final result from active bars
 */
export function buildResult(
    activeBars: readonly IActiveBar[],
    unplacedPieces: I1DPieceInput[],
    totalExpandedPieces: number,
    options: I1DAlgorithmOptions
): I1DOptimizationResult {
    const barResults: IBarCuttingResult[] = [];

    for (const bar of activeBars) {
        const { waste, wastePercentage } = calculateBarWaste(bar);
        const usableWaste = calculateUsableWaste(bar, options);

        barResults.push({
            stockId: bar.stockId,
            stockLength: bar.stockLength,
            cuts: bar.cuts.map((cut) => ({
                pieceId: cut.pieceId,
                orderItemId: cut.orderItemId,
                position: cut.position,
                length: cut.length
            })),
            waste,
            wastePercentage,
            usableWaste: usableWaste ?? undefined
        });
    }

    const unplacedCount = unplacedPieces.reduce((sum, p) => sum + p.quantity, 0);
    const placedCount = totalExpandedPieces - unplacedCount;
    const stats = calculate1DStatistics(activeBars, placedCount);

    return {
        success: unplacedPieces.length === 0,
        bars: barResults,
        totalWaste: stats.totalWaste,
        totalWastePercentage: stats.wastePercentage,
        stockUsedCount: barResults.length,
        unplacedPieces,
        statistics: {
            totalPieces: stats.totalPieces,
            totalStockLength: stats.totalStockLength,
            totalUsedLength: stats.totalUsedLength,
            efficiency: stats.efficiency
        }
    };
}
