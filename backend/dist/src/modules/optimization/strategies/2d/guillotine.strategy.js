"use strict";
/**
 * Guillotine Cutting Strategy
 * 2D cutting optimization algorithm with guillotine constraints
 * Following SRP - Single algorithm implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuillotineStrategy = void 0;
class GuillotineStrategy {
    name = '2D_GUILLOTINE';
    type = '2D';
    description = 'Guillotine Cutting - Only straight cuts from edge to edge';
    execute(pieces, stock, options) {
        if (pieces.length === 0 || stock.length === 0) {
            return this.emptyResult();
        }
        const expandedPieces = this.expandPieces(pieces);
        expandedPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        const sortedStock = [...stock].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        const activeSheets = [];
        const unplacedPieces = [];
        const stockUsage = new Map();
        const { kerf, allowRotation } = options;
        for (const s of sortedStock) {
            stockUsage.set(s.id, s.available);
        }
        for (const piece of expandedPieces) {
            const placed = this.tryPlaceInActiveSheets(activeSheets, piece, kerf, allowRotation);
            if (!placed) {
                const newSheet = this.tryCreateNewSheet(sortedStock, stockUsage, piece, kerf, allowRotation);
                if (newSheet) {
                    activeSheets.push(newSheet);
                }
                else {
                    this.addUnplacedPiece(unplacedPieces, piece);
                }
            }
        }
        return this.buildResult(activeSheets, expandedPieces, unplacedPieces);
    }
    expandPieces(pieces) {
        const expanded = [];
        for (const piece of pieces) {
            for (let i = 0; i < piece.quantity; i++) {
                expanded.push({
                    id: `${piece.id}_${i}`,
                    width: piece.width,
                    height: piece.height,
                    orderItemId: piece.orderItemId,
                    originalId: piece.id,
                    canRotate: piece.canRotate
                });
            }
        }
        return expanded;
    }
    tryPlaceInActiveSheets(sheets, piece, kerf, allowRotation) {
        const orientations = this.getOrientations(piece, allowRotation);
        for (const sheet of sheets) {
            for (const orient of orientations) {
                const rectIndex = this.findBestFreeRect(sheet.freeRects, orient, kerf);
                if (rectIndex >= 0) {
                    const rect = sheet.freeRects[rectIndex];
                    sheet.placements.push({
                        pieceId: piece.id,
                        orderItemId: piece.orderItemId,
                        x: rect.x,
                        y: rect.y,
                        width: orient.width,
                        height: orient.height,
                        rotated: orient.rotated
                    });
                    this.splitFreeRect(sheet.freeRects, rectIndex, orient, kerf);
                    return true;
                }
            }
        }
        return false;
    }
    getOrientations(piece, allowRotation) {
        const orientations = [{ width: piece.width, height: piece.height, rotated: false }];
        if (allowRotation && piece.canRotate && piece.width !== piece.height) {
            orientations.push({ width: piece.height, height: piece.width, rotated: true });
        }
        return orientations;
    }
    findBestFreeRect(freeRects, dims, kerf) {
        let bestIndex = -1;
        let bestShortSide = Infinity;
        for (let i = 0; i < freeRects.length; i++) {
            const rect = freeRects[i];
            if (rect.width >= dims.width + kerf && rect.height >= dims.height + kerf) {
                const shortSide = Math.min(rect.width - dims.width - kerf, rect.height - dims.height - kerf);
                if (shortSide < bestShortSide) {
                    bestShortSide = shortSide;
                    bestIndex = i;
                }
            }
        }
        return bestIndex;
    }
    splitFreeRect(freeRects, index, dims, kerf) {
        const rect = freeRects[index];
        const pieceWidth = dims.width + kerf;
        const pieceHeight = dims.height + kerf;
        // Remove the used rectangle
        freeRects.splice(index, 1);
        // Create two new rectangles (guillotine split)
        const rightWidth = rect.width - pieceWidth;
        const topHeight = rect.height - pieceHeight;
        // Horizontal split (right side)
        if (rightWidth > kerf) {
            freeRects.push({
                x: rect.x + pieceWidth,
                y: rect.y,
                width: rightWidth,
                height: rect.height
            });
        }
        // Vertical split (top side) - only the piece width
        if (topHeight > kerf) {
            freeRects.push({
                x: rect.x,
                y: rect.y + pieceHeight,
                width: pieceWidth,
                height: topHeight
            });
        }
    }
    tryCreateNewSheet(stock, stockUsage, piece, kerf, allowRotation) {
        const orientations = this.getOrientations(piece, allowRotation);
        for (const s of stock) {
            const remaining = stockUsage.get(s.id) ?? 0;
            if (remaining <= 0)
                continue;
            for (const orient of orientations) {
                const fitsInStock = s.width >= orient.width + kerf && s.height >= orient.height + kerf;
                if (!fitsInStock)
                    continue;
                stockUsage.set(s.id, remaining - 1);
                return this.initializeSheet(s, piece, orient, kerf);
            }
        }
        return null;
    }
    initializeSheet(stock, piece, orient, kerf) {
        const pieceWidth = orient.width + kerf;
        const pieceHeight = orient.height + kerf;
        const sheet = {
            stockId: stock.id,
            width: stock.width,
            height: stock.height,
            placements: [{
                    pieceId: piece.id,
                    orderItemId: piece.orderItemId,
                    x: 0,
                    y: 0,
                    width: orient.width,
                    height: orient.height,
                    rotated: orient.rotated
                }],
            freeRects: []
        };
        // Initialize free rectangles after first placement
        if (stock.width - pieceWidth > kerf) {
            sheet.freeRects.push({
                x: pieceWidth,
                y: 0,
                width: stock.width - pieceWidth,
                height: stock.height
            });
        }
        if (stock.height - pieceHeight > kerf) {
            sheet.freeRects.push({
                x: 0,
                y: pieceHeight,
                width: pieceWidth,
                height: stock.height - pieceHeight
            });
        }
        return sheet;
    }
    addUnplacedPiece(unplacedPieces, piece) {
        const existing = unplacedPieces.find(p => p.id === piece.originalId);
        if (existing) {
            existing.quantity++;
        }
        else {
            unplacedPieces.push({
                id: piece.originalId,
                width: piece.width,
                height: piece.height,
                quantity: 1,
                orderItemId: piece.orderItemId ?? '',
                canRotate: piece.canRotate
            });
        }
    }
    buildResult(sheets, expandedPieces, unplacedPieces) {
        let totalWasteArea = 0;
        let totalStockArea = 0;
        let totalUsedArea = 0;
        const sheetResults = sheets.map(sheet => {
            const stockArea = sheet.width * sheet.height;
            const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
            const wasteArea = stockArea - usedArea;
            const wastePercentage = (wasteArea / stockArea) * 100;
            totalStockArea += stockArea;
            totalUsedArea += usedArea;
            totalWasteArea += wasteArea;
            return {
                stockId: sheet.stockId,
                stockWidth: sheet.width,
                stockHeight: sheet.height,
                placements: sheet.placements,
                wasteArea,
                wastePercentage,
                usedArea
            };
        });
        const totalWastePercentage = totalStockArea > 0
            ? (totalWasteArea / totalStockArea) * 100
            : 0;
        return {
            success: unplacedPieces.length === 0,
            sheets: sheetResults,
            totalWasteArea,
            totalWastePercentage,
            stockUsedCount: sheets.length,
            unplacedPieces,
            statistics: {
                totalPieces: expandedPieces.length - unplacedPieces.reduce((s, p) => s + p.quantity, 0),
                totalStockArea,
                totalUsedArea,
                efficiency: totalStockArea > 0 ? (totalUsedArea / totalStockArea) * 100 : 0
            }
        };
    }
    emptyResult() {
        return {
            success: false,
            sheets: [],
            totalWasteArea: 0,
            totalWastePercentage: 0,
            stockUsedCount: 0,
            unplacedPieces: [],
            statistics: {
                totalPieces: 0,
                totalStockArea: 0,
                totalUsedArea: 0,
                efficiency: 0
            }
        };
    }
}
exports.GuillotineStrategy = GuillotineStrategy;
//# sourceMappingURL=guillotine.strategy.js.map