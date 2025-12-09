"use strict";
/**
 * Bottom-Left Fill Strategy
 * 2D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottomLeftStrategy = void 0;
class BottomLeftStrategy {
    name = '2D_BOTTOM_LEFT';
    type = '2D';
    description = 'Bottom-Left Fill - Places pieces at the lowest available position';
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
                const position = this.findBottomLeftPosition(sheet, orient, kerf);
                if (position) {
                    sheet.placements.push({
                        pieceId: piece.id,
                        orderItemId: piece.orderItemId,
                        x: position.x,
                        y: position.y,
                        width: orient.width,
                        height: orient.height,
                        rotated: orient.rotated
                    });
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
    findBottomLeftPosition(sheet, dims, kerf) {
        // Try positions from bottom-left, moving up and right
        for (let y = 0; y <= sheet.height - dims.height; y++) {
            for (let x = 0; x <= sheet.width - dims.width; x++) {
                const rect = { x, y, width: dims.width, height: dims.height };
                if (this.canPlace(rect, sheet, kerf)) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    canPlace(rect, sheet, kerf) {
        if (rect.x + rect.width > sheet.width || rect.y + rect.height > sheet.height) {
            return false;
        }
        for (const placement of sheet.placements) {
            const placementRect = {
                x: placement.x - kerf,
                y: placement.y - kerf,
                width: placement.width + kerf * 2,
                height: placement.height + kerf * 2
            };
            if (this.rectanglesOverlap(rect, placementRect)) {
                return false;
            }
        }
        return true;
    }
    rectanglesOverlap(r1, r2) {
        return !(r1.x + r1.width <= r2.x || r2.x + r2.width <= r1.x ||
            r1.y + r1.height <= r2.y || r2.y + r2.height <= r1.y);
    }
    tryCreateNewSheet(stock, stockUsage, piece, kerf, allowRotation) {
        const orientations = this.getOrientations(piece, allowRotation);
        for (const s of stock) {
            const remaining = stockUsage.get(s.id) ?? 0;
            if (remaining <= 0)
                continue;
            for (const orient of orientations) {
                if (s.width >= orient.width && s.height >= orient.height) {
                    stockUsage.set(s.id, remaining - 1);
                    return {
                        stockId: s.id,
                        width: s.width,
                        height: s.height,
                        placements: [{
                                pieceId: piece.id,
                                orderItemId: piece.orderItemId,
                                x: 0,
                                y: 0,
                                width: orient.width,
                                height: orient.height,
                                rotated: orient.rotated
                            }]
                    };
                }
            }
        }
        return null;
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
exports.BottomLeftStrategy = BottomLeftStrategy;
//# sourceMappingURL=bottom-left.strategy.js.map