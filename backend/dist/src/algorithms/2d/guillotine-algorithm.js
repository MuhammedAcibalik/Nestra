"use strict";
/**
 * Guillotine Cutting Algorithm
 * Splits sheets using guillotine cuts (full-length horizontal/vertical cuts)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUILLOTINE_ALGORITHM = void 0;
exports.guillotineCutting = guillotineCutting;
const piece_expander_1 = require("../core/piece-expander");
const stock_manager_1 = require("../core/stock-manager");
const geometry_1 = require("./geometry");
const sheet_manager_1 = require("./sheet-manager");
const unplaced_collector_1 = require("./unplaced-collector");
const result_builder_1 = require("./result-builder");
// ==================== GUILLOTINE ALGORITHM ====================
/**
 * Guillotine Cutting Algorithm
 *
 * Strategy:
 * 1. Sort pieces by area (descending)
 * 2. Track free rectangles in each sheet
 * 3. Use best short side fit for placement
 * 4. Split remaining area with guillotine cuts
 */
function guillotineCutting(pieces, stock, options) {
    const expandedPieces = (0, piece_expander_1.sort2DByAreaDesc)((0, piece_expander_1.expand2DPieces)(pieces));
    const stockManager = new stock_manager_1.Stock2DManager(stock);
    const unplaced = new unplaced_collector_1.UnplacedCollector2D();
    const activeSheets = [];
    for (const piece of expandedPieces) {
        let placed = false;
        // Try existing sheets
        for (const sheet of activeSheets) {
            if ((0, sheet_manager_1.tryPlaceGuillotine)(sheet, piece, options)) {
                placed = true;
                break;
            }
        }
        // Try new sheet
        if (!placed) {
            const orientations = (0, geometry_1.getOrientations)(piece.width, piece.height, piece.canRotate, options.allowRotation);
            for (const orient of orientations) {
                const availableStock = stockManager.findAvailableStock(orient.width, orient.height);
                if (availableStock) {
                    const newSheet = (0, sheet_manager_1.createGuillotineSheet)(availableStock.id, availableStock.width, availableStock.height, piece, orient.rotated, options.kerf);
                    activeSheets.push(newSheet);
                    stockManager.consumeStock(availableStock.id);
                    placed = true;
                    break;
                }
            }
        }
        if (!placed) {
            unplaced.add(piece);
        }
    }
    return (0, result_builder_1.buildResult)(activeSheets, unplaced.getAll(), expandedPieces.length, options);
}
exports.GUILLOTINE_ALGORITHM = {
    name: '2D_GUILLOTINE',
    type: '2D',
    description: 'Guillotine Cutting - Uses full-length cuts for splitting'
};
//# sourceMappingURL=guillotine-algorithm.js.map