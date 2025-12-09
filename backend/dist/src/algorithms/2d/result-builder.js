"use strict";
/**
 * 2D Result Builder
 * Transforms active sheets into final result format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResult = buildResult;
const statistics_calculator_1 = require("../core/statistics-calculator");
// ==================== RESULT BUILDER ====================
function buildResult(activeSheets, unplacedPieces, totalExpandedPieces, _options) {
    const sheetResults = [];
    for (const sheet of activeSheets) {
        const { wasteArea, wastePercentage, usedArea } = (0, statistics_calculator_1.calculateSheetWaste)(sheet);
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
    const stats = (0, statistics_calculator_1.calculate2DStatistics)(activeSheets, placedCount);
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
//# sourceMappingURL=result-builder.js.map