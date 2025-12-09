"use strict";
/**
 * 1D Bin (Bar) Manager
 * Manages active bars during 1D cutting optimization
 * Single Responsibility: Only handles bar state operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActiveBar = createActiveBar;
exports.calculateRequiredLength = calculateRequiredLength;
exports.canFitInBar = canFitInBar;
exports.placePieceInBar = placePieceInBar;
exports.findFirstFitBar = findFirstFitBar;
exports.findBestFitBar = findBestFitBar;
exports.calculateUsableWaste = calculateUsableWaste;
// ==================== BAR FACTORY ====================
/**
 * Create a new active bar with initial piece
 */
function createActiveBar(stockId, stockLength, piece) {
    const cut = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        position: 0,
        length: piece.length
    };
    return {
        stockId,
        stockLength,
        remainingLength: stockLength - piece.length,
        currentPosition: piece.length,
        cuts: [cut]
    };
}
// ==================== PLACEMENT OPERATIONS ====================
/**
 * Calculate required length for placing a piece in a bar
 */
function calculateRequiredLength(bar, pieceLength, kerf) {
    const kerfNeeded = bar.cuts.length > 0 ? kerf : 0;
    return pieceLength + kerfNeeded;
}
/**
 * Check if a piece fits in a bar
 */
function canFitInBar(bar, pieceLength, kerf) {
    const required = calculateRequiredLength(bar, pieceLength, kerf);
    return bar.remainingLength >= required;
}
/**
 * Place a piece in a bar (mutates bar state)
 */
function placePieceInBar(bar, piece, kerf) {
    const kerfNeeded = bar.cuts.length > 0 ? kerf : 0;
    const position = bar.currentPosition + kerfNeeded;
    const requiredLength = calculateRequiredLength(bar, piece.length, kerf);
    const cut = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        position,
        length: piece.length
    };
    bar.cuts.push(cut);
    bar.currentPosition = position + piece.length;
    bar.remainingLength -= requiredLength;
}
// ==================== BAR SELECTION STRATEGIES ====================
/**
 * First Fit: Find the first bar that can fit the piece
 */
function findFirstFitBar(activeBars, pieceLength, kerf) {
    for (const bar of activeBars) {
        if (canFitInBar(bar, pieceLength, kerf)) {
            return bar;
        }
    }
    return null;
}
/**
 * Best Fit: Find the bar that leaves minimum remaining space
 */
function findBestFitBar(activeBars, pieceLength, kerf) {
    let bestBar = null;
    let minRemaining = Infinity;
    for (const bar of activeBars) {
        if (canFitInBar(bar, pieceLength, kerf)) {
            const required = calculateRequiredLength(bar, pieceLength, kerf);
            const remaining = bar.remainingLength - required;
            if (remaining < minRemaining) {
                minRemaining = remaining;
                bestBar = bar;
            }
        }
    }
    return bestBar;
}
// ==================== USABLE WASTE ====================
/**
 * Calculate usable waste for a bar
 */
function calculateUsableWaste(bar, options) {
    const wasteLength = bar.remainingLength - options.kerf;
    if (wasteLength >= options.minUsableWaste) {
        return {
            position: bar.currentPosition + options.kerf,
            length: wasteLength
        };
    }
    return null;
}
//# sourceMappingURL=bin-manager.js.map