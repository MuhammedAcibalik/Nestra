"use strict";
/**
 * 1D Cutting Optimization Algorithm
 * Implements First Fit Decreasing (FFD) and Best Fit Decreasing (BFD)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.firstFitDecreasing = firstFitDecreasing;
exports.bestFitDecreasing = bestFitDecreasing;
exports.optimize1D = optimize1D;
/**
 * Expands pieces array based on quantity
 */
function expandPieces(pieces) {
    const expanded = [];
    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                length: piece.length,
                orderItemId: piece.orderItemId,
                originalId: piece.id
            });
        }
    }
    return expanded;
}
/**
 * First Fit Decreasing Algorithm
 * Sorts pieces by length (descending) and places each in the first bar that fits
 */
function firstFitDecreasing(pieces, stockBars, options) {
    const { kerf, minUsableWaste } = options;
    // Expand pieces and sort by length descending
    const expandedPieces = expandPieces(pieces).sort((a, b) => b.length - a.length);
    // Sort stock bars by length descending (use larger bars first)
    const sortedStock = [...stockBars]
        .filter(s => s.available > 0)
        .sort((a, b) => b.length - a.length);
    const results = [];
    const unplacedPieces = [];
    const stockUsage = new Map();
    // Initialize stock usage tracking
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, { remaining: stock.available, usedCount: 0 });
    }
    const activeBars = [];
    for (const piece of expandedPieces) {
        let placed = false;
        // Try to fit in an existing active bar (First Fit)
        for (const bar of activeBars) {
            const requiredLength = piece.length + (bar.cuts.length > 0 ? kerf : 0);
            if (bar.remainingLength >= requiredLength) {
                const position = bar.currentPosition + (bar.cuts.length > 0 ? kerf : 0);
                bar.cuts.push({
                    pieceId: piece.id,
                    orderItemId: piece.orderItemId,
                    position,
                    length: piece.length
                });
                bar.currentPosition = position + piece.length;
                bar.remainingLength -= requiredLength;
                placed = true;
                break;
            }
        }
        // If not placed, get a new bar from stock
        if (!placed) {
            for (const stock of sortedStock) {
                const usage = stockUsage.get(stock.id);
                if (usage.remaining > 0 && stock.length >= piece.length) {
                    const newBar = {
                        stockId: stock.id,
                        stockLength: stock.length,
                        remainingLength: stock.length - piece.length,
                        cuts: [{
                                pieceId: piece.id,
                                orderItemId: piece.orderItemId,
                                position: 0,
                                length: piece.length
                            }],
                        currentPosition: piece.length
                    };
                    activeBars.push(newBar);
                    usage.remaining--;
                    usage.usedCount++;
                    placed = true;
                    break;
                }
            }
        }
        // If still not placed, track as unplaced
        if (!placed) {
            const existingUnplaced = unplacedPieces.find(p => p.id === piece.originalId);
            if (existingUnplaced) {
                existingUnplaced.quantity++;
            }
            else {
                unplacedPieces.push({
                    id: piece.originalId,
                    length: piece.length,
                    quantity: 1,
                    orderItemId: piece.orderItemId
                });
            }
        }
    }
    // Convert active bars to results
    let totalWaste = 0;
    let totalStockLength = 0;
    let totalUsedLength = 0;
    for (const bar of activeBars) {
        const waste = bar.remainingLength;
        const wastePercentage = (waste / bar.stockLength) * 100;
        const result = {
            stockId: bar.stockId,
            stockLength: bar.stockLength,
            cuts: bar.cuts,
            waste,
            wastePercentage
        };
        // Check if waste is usable
        if (waste >= minUsableWaste) {
            result.usableWaste = {
                position: bar.currentPosition + kerf,
                length: waste - kerf
            };
        }
        results.push(result);
        totalWaste += waste;
        totalStockLength += bar.stockLength;
        totalUsedLength += bar.stockLength - waste;
    }
    const totalPieces = expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0);
    return {
        success: unplacedPieces.length === 0,
        bars: results,
        totalWaste,
        totalWastePercentage: totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces,
            totalStockLength,
            totalUsedLength,
            efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
        }
    };
}
/**
 * Best Fit Decreasing Algorithm
 * Similar to FFD but places each piece in the bar with the least remaining space
 */
function bestFitDecreasing(pieces, stockBars, options) {
    const { kerf, minUsableWaste } = options;
    // Expand pieces and sort by length descending
    const expandedPieces = expandPieces(pieces).sort((a, b) => b.length - a.length);
    // Sort stock bars by length
    const sortedStock = [...stockBars]
        .filter(s => s.available > 0)
        .sort((a, b) => a.length - b.length); // Prefer smaller bars first
    const activeBars = [];
    const unplacedPieces = [];
    const stockUsage = new Map();
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, { remaining: stock.available });
    }
    for (const piece of expandedPieces) {
        let placed = false;
        let bestBar = null;
        let minRemaining = Infinity;
        // Find the best fitting bar (least remaining space after placement)
        for (const bar of activeBars) {
            const requiredLength = piece.length + (bar.cuts.length > 0 ? kerf : 0);
            if (bar.remainingLength >= requiredLength) {
                const remaining = bar.remainingLength - requiredLength;
                if (remaining < minRemaining) {
                    minRemaining = remaining;
                    bestBar = bar;
                }
            }
        }
        if (bestBar) {
            const position = bestBar.currentPosition + (bestBar.cuts.length > 0 ? kerf : 0);
            bestBar.cuts.push({
                pieceId: piece.id,
                orderItemId: piece.orderItemId,
                position,
                length: piece.length
            });
            bestBar.currentPosition = position + piece.length;
            bestBar.remainingLength = minRemaining;
            placed = true;
        }
        // If not placed, get a new bar (smallest that fits)
        if (!placed) {
            for (const stock of sortedStock) {
                const usage = stockUsage.get(stock.id);
                if (usage.remaining > 0 && stock.length >= piece.length) {
                    const newBar = {
                        stockId: stock.id,
                        stockLength: stock.length,
                        remainingLength: stock.length - piece.length,
                        cuts: [{
                                pieceId: piece.id,
                                orderItemId: piece.orderItemId,
                                position: 0,
                                length: piece.length
                            }],
                        currentPosition: piece.length
                    };
                    activeBars.push(newBar);
                    usage.remaining--;
                    placed = true;
                    break;
                }
            }
        }
        if (!placed) {
            const existingUnplaced = unplacedPieces.find(p => p.id === piece.originalId);
            if (existingUnplaced) {
                existingUnplaced.quantity++;
            }
            else {
                unplacedPieces.push({
                    id: piece.originalId,
                    length: piece.length,
                    quantity: 1,
                    orderItemId: piece.orderItemId
                });
            }
        }
    }
    // Build results
    let totalWaste = 0;
    let totalStockLength = 0;
    let totalUsedLength = 0;
    const results = [];
    for (const bar of activeBars) {
        const waste = bar.remainingLength;
        const result = {
            stockId: bar.stockId,
            stockLength: bar.stockLength,
            cuts: bar.cuts,
            waste,
            wastePercentage: (waste / bar.stockLength) * 100
        };
        if (waste >= minUsableWaste) {
            result.usableWaste = {
                position: bar.currentPosition + kerf,
                length: waste - kerf
            };
        }
        results.push(result);
        totalWaste += waste;
        totalStockLength += bar.stockLength;
        totalUsedLength += bar.stockLength - waste;
    }
    return {
        success: unplacedPieces.length === 0,
        bars: results,
        totalWaste,
        totalWastePercentage: totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces: expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0),
            totalStockLength,
            totalUsedLength,
            efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
        }
    };
}
/**
 * Main optimization function that selects algorithm based on options
 */
function optimize1D(pieces, stockBars, options) {
    switch (options.algorithm) {
        case 'FFD':
            return firstFitDecreasing(pieces, stockBars, options);
        case 'BFD':
            return bestFitDecreasing(pieces, stockBars, options);
        case 'BRANCH_BOUND':
            // For now, fall back to BFD for complex algorithm
            // Branch and Bound can be implemented for smaller datasets
            return bestFitDecreasing(pieces, stockBars, options);
        default:
            return firstFitDecreasing(pieces, stockBars, options);
    }
}
//# sourceMappingURL=cutting1d.js.map