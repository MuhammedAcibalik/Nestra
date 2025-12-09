/**
 * Statistics Calculator
 * Calculates optimization metrics (waste, efficiency)
 * Single Responsibility: Only handles statistics computation
 */

import { IActiveBar, IActiveSheet, I1DStatistics, I2DStatistics } from './types';

// ==================== 1D STATISTICS ====================

/**
 * Calculate 1D optimization statistics
 */
export function calculate1DStatistics(
    activeBars: readonly IActiveBar[],
    totalPiecesPlaced: number
): I1DStatistics {
    let totalStockLength = 0;
    let totalWaste = 0;

    for (const bar of activeBars) {
        totalStockLength += bar.stockLength;
        totalWaste += bar.remainingLength;
    }

    const totalUsedLength = totalStockLength - totalWaste;
    const efficiency = totalStockLength > 0
        ? (totalUsedLength / totalStockLength) * 100
        : 0;
    const wastePercentage = totalStockLength > 0
        ? (totalWaste / totalStockLength) * 100
        : 0;

    return {
        totalPieces: totalPiecesPlaced,
        totalStockLength,
        totalUsedLength,
        efficiency,
        totalWaste,
        wastePercentage
    };
}

// ==================== 2D STATISTICS ====================

/**
 * Calculate 2D optimization statistics
 */
export function calculate2DStatistics(
    activeSheets: readonly IActiveSheet[],
    totalPiecesPlaced: number
): I2DStatistics {
    let totalStockArea = 0;
    let totalUsedArea = 0;

    for (const sheet of activeSheets) {
        const stockArea = sheet.width * sheet.height;
        const usedArea = sheet.placements.reduce(
            (sum, p) => sum + (p.width * p.height),
            0
        );

        totalStockArea += stockArea;
        totalUsedArea += usedArea;
    }

    const totalWasteArea = totalStockArea - totalUsedArea;
    const efficiency = totalStockArea > 0
        ? (totalUsedArea / totalStockArea) * 100
        : 0;
    const wastePercentage = totalStockArea > 0
        ? (totalWasteArea / totalStockArea) * 100
        : 0;

    return {
        totalPieces: totalPiecesPlaced,
        totalStockArea,
        totalUsedArea,
        efficiency,
        totalWasteArea,
        wastePercentage
    };
}

// ==================== BAR/SHEET RESULTS ====================

/**
 * Calculate waste for a single 1D bar
 */
export function calculateBarWaste(bar: IActiveBar): { waste: number; wastePercentage: number } {
    const waste = bar.remainingLength;
    const wastePercentage = bar.stockLength > 0
        ? (waste / bar.stockLength) * 100
        : 0;

    return { waste, wastePercentage };
}

/**
 * Calculate waste for a single 2D sheet
 */
export function calculateSheetWaste(sheet: IActiveSheet): { wasteArea: number; wastePercentage: number; usedArea: number } {
    const stockArea = sheet.width * sheet.height;
    const usedArea = sheet.placements.reduce(
        (sum, p) => sum + (p.width * p.height),
        0
    );
    const wasteArea = stockArea - usedArea;
    const wastePercentage = stockArea > 0
        ? (wasteArea / stockArea) * 100
        : 0;

    return { wasteArea, wastePercentage, usedArea };
}
