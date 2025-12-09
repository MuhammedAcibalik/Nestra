"use strict";
/**
 * Bottom-Left Fill Algorithm
 * Places pieces at the lowest, leftmost available position
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOTTOM_LEFT_ALGORITHM = void 0;
exports.bottomLeftFill = bottomLeftFill;
const piece_expander_1 = require("../core/piece-expander");
const stock_manager_1 = require("../core/stock-manager");
const geometry_1 = require("./geometry");
const sheet_manager_1 = require("./sheet-manager");
const unplaced_collector_1 = require("./unplaced-collector");
const result_builder_1 = require("./result-builder");
// ==================== BOTTOM-LEFT ALGORITHM ====================
/**
 * Bottom-Left Fill Algorithm
 *
 * Strategy:
 * 1. Sort pieces by area (descending)
 * 2. For each piece, find the bottom-left position that fits
 * 3. If no position fits, create a new sheet
 */
function bottomLeftFill(pieces, stock, options) {
    const expandedPieces = (0, piece_expander_1.sort2DByAreaDesc)((0, piece_expander_1.expand2DPieces)(pieces));
    const stockManager = new stock_manager_1.Stock2DManager(stock);
    const unplaced = new unplaced_collector_1.UnplacedCollector2D();
    const activeSheets = [];
    for (const piece of expandedPieces) {
        let placed = false;
        // Try existing sheets
        for (const sheet of activeSheets) {
            if ((0, sheet_manager_1.tryPlaceBottomLeft)(sheet, piece, options)) {
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
                    const newSheet = (0, sheet_manager_1.createActiveSheet)(availableStock.id, availableStock.width, availableStock.height, piece, orient.rotated);
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
exports.BOTTOM_LEFT_ALGORITHM = {
    name: '2D_BOTTOM_LEFT',
    type: '2D',
    description: 'Bottom-Left Fill - Places pieces at lowest-leftmost position'
};
//# sourceMappingURL=bottom-left-algorithm.js.map