"use strict";
/**
 * Statistics Calculator
 * Calculates optimization metrics (waste, efficiency)
 * Single Responsibility: Only handles statistics computation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate1DStatistics = calculate1DStatistics;
exports.calculate2DStatistics = calculate2DStatistics;
exports.calculateBarWaste = calculateBarWaste;
exports.calculateSheetWaste = calculateSheetWaste;
// ==================== 1D STATISTICS ====================
/**
 * Calculate 1D optimization statistics
 */
function calculate1DStatistics(activeBars, totalPiecesPlaced) {
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
function calculate2DStatistics(activeSheets, totalPiecesPlaced) {
    let totalStockArea = 0;
    let totalUsedArea = 0;
    for (const sheet of activeSheets) {
        const stockArea = sheet.width * sheet.height;
        const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
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
function calculateBarWaste(bar) {
    const waste = bar.remainingLength;
    const wastePercentage = bar.stockLength > 0
        ? (waste / bar.stockLength) * 100
        : 0;
    return { waste, wastePercentage };
}
/**
 * Calculate waste for a single 2D sheet
 */
function calculateSheetWaste(sheet) {
    const stockArea = sheet.width * sheet.height;
    const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
    const wasteArea = stockArea - usedArea;
    const wastePercentage = stockArea > 0
        ? (wasteArea / stockArea) * 100
        : 0;
    return { wasteArea, wastePercentage, usedArea };
}
//# sourceMappingURL=statistics-calculator.js.map