"use strict";
/**
 * 1D Result Builder
 * Transforms active bars into final result format
 * Single Responsibility: Only handles result construction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResult = buildResult;
const statistics_calculator_1 = require("../core/statistics-calculator");
const bin_manager_1 = require("./bin-manager");
// ==================== RESULT BUILDER ====================
/**
 * Build final result from active bars
 */
function buildResult(activeBars, unplacedPieces, totalExpandedPieces, options) {
    const barResults = [];
    for (const bar of activeBars) {
        const { waste, wastePercentage } = (0, statistics_calculator_1.calculateBarWaste)(bar);
        const usableWaste = (0, bin_manager_1.calculateUsableWaste)(bar, options);
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
    const stats = (0, statistics_calculator_1.calculate1DStatistics)(activeBars, placedCount);
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
//# sourceMappingURL=result-builder.js.map