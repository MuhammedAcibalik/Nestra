"use strict";
/**
 * First Fit Decreasing (FFD) Algorithm
 * Places pieces in the first bar that fits
 * Following Strategy Pattern - implements I1DAlgorithm interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFD_ALGORITHM = void 0;
exports.firstFitDecreasing = firstFitDecreasing;
const piece_expander_1 = require("../core/piece-expander");
const stock_manager_1 = require("../core/stock-manager");
const bin_manager_1 = require("./bin-manager");
const unplaced_collector_1 = require("./unplaced-collector");
const result_builder_1 = require("./result-builder");
// ==================== FFD ALGORITHM ====================
/**
 * First Fit Decreasing Algorithm
 *
 * Strategy:
 * 1. Sort pieces by length (descending)
 * 2. For each piece, find the first bar that can fit it
 * 3. If no bar fits, create a new bar
 *
 * Complexity: O(n * m) where n = pieces, m = bars
 */
function firstFitDecreasing(pieces, stock, options) {
    // Expand and sort pieces
    const expandedPieces = (0, piece_expander_1.sort1DByLengthDesc)((0, piece_expander_1.expand1DPieces)(pieces));
    // Initialize managers
    const stockManager = new stock_manager_1.Stock1DManager(stock, 'DESC');
    const unplaced = new unplaced_collector_1.UnplacedCollector1D();
    const activeBars = [];
    // Process each piece
    for (const piece of expandedPieces) {
        let placed = false;
        // Try to fit in existing bar (First Fit)
        const bar = (0, bin_manager_1.findFirstFitBar)(activeBars, piece.length, options.kerf);
        if (bar) {
            (0, bin_manager_1.placePieceInBar)(bar, piece, options.kerf);
            placed = true;
        }
        // If not placed, try to get new bar from stock
        if (!placed) {
            const availableStock = stockManager.findAvailableStock(piece.length);
            if (availableStock) {
                const newBar = (0, bin_manager_1.createActiveBar)(availableStock.id, availableStock.length, piece);
                activeBars.push(newBar);
                stockManager.consumeStock(availableStock.id);
                placed = true;
            }
        }
        // Track unplaced pieces
        if (!placed) {
            unplaced.add(piece);
        }
    }
    return (0, result_builder_1.buildResult)(activeBars, unplaced.getAll(), expandedPieces.length, options);
}
// ==================== ALGORITHM METADATA ====================
exports.FFD_ALGORITHM = {
    name: '1D_FFD',
    type: '1D',
    description: 'First Fit Decreasing - Places pieces in first available bar'
};
//# sourceMappingURL=ffd-algorithm.js.map