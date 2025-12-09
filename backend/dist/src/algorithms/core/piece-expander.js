"use strict";
/**
 * Piece Expander
 * Expands pieces with quantity into individual units
 * Single Responsibility: Only handles piece expansion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.expand1DPieces = expand1DPieces;
exports.expand2DPieces = expand2DPieces;
exports.sort1DByLengthDesc = sort1DByLengthDesc;
exports.sort2DByAreaDesc = sort2DByAreaDesc;
// ==================== EXPANDERS ====================
/**
 * Expand 1D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
function expand1DPieces(pieces) {
    const expanded = [];
    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                originalId: piece.id,
                orderItemId: piece.orderItemId,
                length: piece.length
            });
        }
    }
    return expanded;
}
/**
 * Expand 2D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
function expand2DPieces(pieces) {
    const expanded = [];
    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                originalId: piece.id,
                orderItemId: piece.orderItemId,
                width: piece.width,
                height: piece.height,
                canRotate: piece.canRotate
            });
        }
    }
    return expanded;
}
// ==================== SORTING ====================
/**
 * Sort 1D pieces by length (descending)
 * Used by FFD/BFD algorithms
 */
function sort1DByLengthDesc(pieces) {
    return [...pieces].sort((a, b) => b.length - a.length);
}
/**
 * Sort 2D pieces by area (descending)
 * Used by 2D algorithms
 */
function sort2DByAreaDesc(pieces) {
    return [...pieces].sort((a, b) => (b.width * b.height) - (a.width * a.height));
}
//# sourceMappingURL=piece-expander.js.map