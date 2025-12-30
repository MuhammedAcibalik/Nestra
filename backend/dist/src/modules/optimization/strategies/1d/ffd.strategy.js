"use strict";
/**
 * First Fit Decreasing (FFD) Strategy
 * 1D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FFDStrategy = void 0;
class FFDStrategy {
    name = '1D_FFD';
    type = '1D';
    description = 'First Fit Decreasing - Places each piece in the first bar that fits';
    execute(pieces, stock, options) {
        if (pieces.length === 0 || stock.length === 0) {
            return this.emptyResult();
        }
        // Expand pieces by quantity
        const expandedPieces = this.expandPieces(pieces);
        // Sort pieces by length (descending)
        expandedPieces.sort((a, b) => b.length - a.length);
        // Sort stock by length (descending) for better utilization
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
            const placed = this.tryPlaceInExistingBar(activeBars, piece, kerf);
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
    tryPlaceInExistingBar(activeBars, piece, kerf) {
        for (const bar of activeBars) {
            if (bar.remainingLength >= piece.length + kerf) {
                bar.cuts.push({
                    pieceId: piece.id,
                    orderItemId: piece.orderItemId,
                    position: bar.currentPosition,
                    length: piece.length
                });
                bar.currentPosition += piece.length + kerf;
                bar.remainingLength -= piece.length + kerf;
                return true;
            }
        }
        return false;
    }
    tryCreateNewBar(stock, stockUsage, piece, kerf) {
        for (const s of stock) {
            const usage = stockUsage.get(s.id);
            if (usage && usage.remaining > 0 && s.length >= piece.length) {
                usage.remaining--;
                return {
                    stockId: s.id,
                    stockLength: s.length,
                    remainingLength: s.length - piece.length - kerf,
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
exports.FFDStrategy = FFDStrategy;
//# sourceMappingURL=ffd.strategy.js.map