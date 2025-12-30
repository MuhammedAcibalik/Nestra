"use strict";
/**
 * Best Fit Decreasing (BFD) Strategy
 * 1D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BFDStrategy = void 0;
class BFDStrategy {
    name = '1D_BFD';
    type = '1D';
    description = 'Best Fit Decreasing - Places each piece in the bar with least remaining space';
    execute(pieces, stock, options) {
        if (pieces.length === 0 || stock.length === 0) {
            return this.emptyResult();
        }
        // Expand pieces by quantity
        const expandedPieces = this.expandPieces(pieces);
        // Sort pieces by length (descending)
        expandedPieces.sort((a, b) => b.length - a.length);
        // Sort stock by length (descending)
        const sortedStock = [...stock].sort((a, b) => b.length - a.length);
        const activeBars = [];
        const unplacedPieces = [];
        const stockUsage = new Map();
        const { kerf, minUsableWaste } = options;
        // Initialize stock usage
        for (const s of sortedStock) {
            stockUsage.set(s.id, { remaining: s.available });
        }
        // Process each piece
        for (const piece of expandedPieces) {
            const placed = this.tryPlaceInBestBar(activeBars, piece, kerf);
            if (!placed) {
                const newBar = this.tryCreateNewBar(sortedStock, stockUsage, piece, kerf);
                if (newBar) {
                    activeBars.push(newBar);
                }
                else {
                    this.addUnplacedPiece(unplacedPieces, piece);
                }
            }
        }
        return this.buildResult(activeBars, unplacedPieces, minUsableWaste, kerf);
    }
    expandPieces(pieces) {
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
    tryPlaceInBestBar(activeBars, piece, kerf) {
        // Find bar with minimum remaining space that still fits the piece
        let bestBar = null;
        let minRemaining = Infinity;
        for (const bar of activeBars) {
            const requiredSpace = piece.length + kerf;
            if (bar.remainingLength >= requiredSpace) {
                const afterPlacement = bar.remainingLength - requiredSpace;
                if (afterPlacement < minRemaining) {
                    minRemaining = afterPlacement;
                    bestBar = bar;
                }
            }
        }
        if (bestBar) {
            bestBar.cuts.push({
                pieceId: piece.id,
                orderItemId: piece.orderItemId,
                position: bestBar.currentPosition,
                length: piece.length
            });
            bestBar.currentPosition += piece.length + kerf;
            bestBar.remainingLength -= piece.length + kerf;
            return true;
        }
        return false;
    }
    tryCreateNewBar(stock, stockUsage, piece, kerf) {
        // Find smallest stock that fits (minimize waste)
        let bestStock = null;
        let minWaste = Infinity;
        for (const s of stock) {
            const usage = stockUsage.get(s.id);
            if (usage && usage.remaining > 0 && s.length >= piece.length) {
                const waste = s.length - piece.length;
                if (waste < minWaste) {
                    minWaste = waste;
                    bestStock = s;
                }
            }
        }
        if (bestStock) {
            const usage = stockUsage.get(bestStock.id);
            usage.remaining--;
            return {
                stockId: bestStock.id,
                stockLength: bestStock.length,
                remainingLength: bestStock.length - piece.length - kerf,
                cuts: [
                    {
                        pieceId: piece.id,
                        orderItemId: piece.orderItemId,
                        position: 0,
                        length: piece.length
                    }
                ],
                currentPosition: piece.length + kerf
            };
        }
        return null;
    }
    addUnplacedPiece(unplacedPieces, piece) {
        const existing = unplacedPieces.find((p) => p.id === piece.originalId);
        if (existing) {
            existing.quantity++;
        }
        else {
            unplacedPieces.push({
                id: piece.originalId,
                length: piece.length,
                quantity: 1,
                orderItemId: piece.orderItemId ?? ''
            });
        }
    }
    buildResult(activeBars, unplacedPieces, minUsableWaste, kerf) {
        let totalWaste = 0;
        let totalStockLength = 0;
        let totalUsedLength = 0;
        let totalPieces = 0;
        const bars = activeBars.map((bar) => {
            const usedLength = bar.cuts.reduce((sum, cut) => sum + cut.length + kerf, 0) - kerf;
            const waste = bar.stockLength - usedLength;
            const wastePercentage = (waste / bar.stockLength) * 100;
            totalStockLength += bar.stockLength;
            totalUsedLength += usedLength;
            totalWaste += waste;
            totalPieces += bar.cuts.length;
            const result = {
                stockId: bar.stockId,
                stockLength: bar.stockLength,
                cuts: bar.cuts,
                waste,
                wastePercentage
            };
            if (waste >= minUsableWaste) {
                result.usableWaste = {
                    position: bar.currentPosition,
                    length: waste
                };
            }
            return result;
        });
        const totalWastePercentage = totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0;
        return {
            success: unplacedPieces.length === 0,
            bars,
            totalWaste,
            totalWastePercentage,
            stockUsedCount: bars.length,
            unplacedPieces,
            statistics: {
                totalPieces,
                totalStockLength,
                totalUsedLength,
                efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
            }
        };
    }
    emptyResult() {
        return {
            success: false,
            bars: [],
            totalWaste: 0,
            totalWastePercentage: 0,
            stockUsedCount: 0,
            unplacedPieces: [],
            statistics: {
                totalPieces: 0,
                totalStockLength: 0,
                totalUsedLength: 0,
                efficiency: 0
            }
        };
    }
}
exports.BFDStrategy = BFDStrategy;
//# sourceMappingURL=bfd.strategy.js.map