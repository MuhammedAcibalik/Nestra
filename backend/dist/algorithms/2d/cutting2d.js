"use strict";
/**
 * 2D Cutting Optimization Algorithm
 * Implements Bottom-Left Fill, Guillotine, and Maximal Rectangles algorithms
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bottomLeftFill = bottomLeftFill;
exports.guillotineCutting = guillotineCutting;
exports.optimize2D = optimize2D;
/**
 * Expand pieces based on quantity
 */
function expandPieces(pieces) {
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
/**
 * Check if two rectangles overlap
 */
function rectanglesOverlap(r1, r2) {
    return !(r1.x + r1.width <= r2.x ||
        r2.x + r2.width <= r1.x ||
        r1.y + r1.height <= r2.y ||
        r2.y + r2.height <= r1.y);
}
/**
 * Check if a piece fits at a position without overlapping existing placements
 */
function canPlace(x, y, width, height, sheetWidth, sheetHeight, placements, kerf) {
    // Check bounds
    if (x + width > sheetWidth || y + height > sheetHeight) {
        return false;
    }
    // Check overlap with existing placements (considering kerf)
    const newRect = { x, y, width: width + kerf, height: height + kerf };
    for (const placement of placements) {
        const existingRect = {
            x: placement.x,
            y: placement.y,
            width: placement.width + kerf,
            height: placement.height + kerf
        };
        if (rectanglesOverlap(newRect, existingRect)) {
            return false;
        }
    }
    return true;
}
/**
 * Bottom-Left Fill Algorithm
 * Places pieces at the lowest-leftmost available position
 */
function bottomLeftFill(pieces, stockSheets, options) {
    const { kerf, allowRotation } = options;
    // Expand and sort pieces by area (largest first)
    const expandedPieces = expandPieces(pieces).sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const sortedStock = [...stockSheets]
        .filter(s => s.available > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const activeSheets = [];
    const unplacedPieces = [];
    const stockUsage = new Map();
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, stock.available);
    }
    for (const piece of expandedPieces) {
        let placed = false;
        // Try to place in existing sheets
        for (const sheet of activeSheets) {
            // Try both orientations if rotation allowed
            const orientations = [
                { w: piece.width, h: piece.height, rotated: false }
            ];
            if (allowRotation && piece.canRotate && piece.width !== piece.height) {
                orientations.push({ w: piece.height, h: piece.width, rotated: true });
            }
            for (const orient of orientations) {
                // Find the best bottom-left position
                const position = findBottomLeftPosition(sheet.width, sheet.height, orient.w, orient.h, sheet.placements, kerf);
                if (position) {
                    sheet.placements.push({
                        pieceId: piece.id,
                        orderItemId: piece.orderItemId,
                        x: position.x,
                        y: position.y,
                        width: orient.w,
                        height: orient.h,
                        rotated: orient.rotated
                    });
                    placed = true;
                    break;
                }
            }
            if (placed)
                break;
        }
        // If not placed, get a new sheet
        if (!placed) {
            for (const stock of sortedStock) {
                const remaining = stockUsage.get(stock.id);
                if (remaining > 0) {
                    const orientations = [
                        { w: piece.width, h: piece.height, rotated: false }
                    ];
                    if (allowRotation && piece.canRotate && piece.width !== piece.height) {
                        orientations.push({ w: piece.height, h: piece.width, rotated: true });
                    }
                    for (const orient of orientations) {
                        if (orient.w <= stock.width && orient.h <= stock.height) {
                            const newSheet = {
                                stockId: stock.id,
                                width: stock.width,
                                height: stock.height,
                                placements: [{
                                        pieceId: piece.id,
                                        orderItemId: piece.orderItemId,
                                        x: 0,
                                        y: 0,
                                        width: orient.w,
                                        height: orient.h,
                                        rotated: orient.rotated
                                    }]
                            };
                            activeSheets.push(newSheet);
                            stockUsage.set(stock.id, remaining - 1);
                            placed = true;
                            break;
                        }
                    }
                    if (placed)
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
                    width: piece.width,
                    height: piece.height,
                    quantity: 1,
                    orderItemId: piece.orderItemId,
                    canRotate: piece.canRotate
                });
            }
        }
    }
    // Build results
    let totalWasteArea = 0;
    let totalStockArea = 0;
    let totalUsedArea = 0;
    const results = [];
    for (const sheet of activeSheets) {
        const stockArea = sheet.width * sheet.height;
        const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
        const wasteArea = stockArea - usedArea;
        results.push({
            stockId: sheet.stockId,
            stockWidth: sheet.width,
            stockHeight: sheet.height,
            placements: sheet.placements,
            wasteArea,
            wastePercentage: (wasteArea / stockArea) * 100,
            usedArea
        });
        totalWasteArea += wasteArea;
        totalStockArea += stockArea;
        totalUsedArea += usedArea;
    }
    return {
        success: unplacedPieces.length === 0,
        sheets: results,
        totalWasteArea,
        totalWastePercentage: totalStockArea > 0 ? (totalWasteArea / totalStockArea) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces: expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0),
            totalStockArea,
            totalUsedArea,
            efficiency: totalStockArea > 0 ? (totalUsedArea / totalStockArea) * 100 : 0
        }
    };
}
/**
 * Find the bottom-left position for a piece
 */
function findBottomLeftPosition(sheetWidth, sheetHeight, pieceWidth, pieceHeight, placements, kerf) {
    // Generate candidate positions (corners of existing placements + origin)
    const candidates = [{ x: 0, y: 0 }];
    for (const p of placements) {
        // Right edge of existing piece
        candidates.push({ x: p.x + p.width + kerf, y: p.y });
        // Top edge of existing piece
        candidates.push({ x: p.x, y: p.y + p.height + kerf });
        // Top-right corner
        candidates.push({ x: p.x + p.width + kerf, y: p.y + p.height + kerf });
    }
    // Sort by y first (bottom), then by x (left)
    candidates.sort((a, b) => {
        if (a.y !== b.y)
            return a.y - b.y;
        return a.x - b.x;
    });
    // Find first valid position
    for (const pos of candidates) {
        if (canPlace(pos.x, pos.y, pieceWidth, pieceHeight, sheetWidth, sheetHeight, placements, kerf)) {
            return pos;
        }
    }
    return null;
}
/**
 * Guillotine Cutting Algorithm
 * Only allows cuts that go fully across the sheet (horizontal or vertical)
 */
function guillotineCutting(pieces, stockSheets, options) {
    // For guillotine cutting, we use a more constrained version of the algorithm
    // This ensures all cuts go edge-to-edge
    const { kerf, allowRotation } = options;
    const expandedPieces = expandPieces(pieces).sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const sortedStock = [...stockSheets]
        .filter(s => s.available > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const activeSheets = [];
    const unplacedPieces = [];
    const stockUsage = new Map();
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, stock.available);
    }
    for (const piece of expandedPieces) {
        let placed = false;
        // Try existing sheets
        for (const sheet of activeSheets) {
            const result = tryPlaceGuillotine(sheet, piece, kerf, allowRotation);
            if (result) {
                sheet.placements.push(result.placement);
                sheet.freeRects = result.newFreeRects;
                placed = true;
                break;
            }
        }
        // Get new sheet if not placed
        if (!placed) {
            for (const stock of sortedStock) {
                const remaining = stockUsage.get(stock.id);
                if (remaining > 0 && stock.width >= piece.width && stock.height >= piece.height) {
                    const rotated = allowRotation && piece.canRotate &&
                        stock.width >= piece.height && stock.height >= piece.width &&
                        piece.width > piece.height;
                    const w = rotated ? piece.height : piece.width;
                    const h = rotated ? piece.width : piece.height;
                    const newSheet = {
                        stockId: stock.id,
                        width: stock.width,
                        height: stock.height,
                        placements: [{
                                pieceId: piece.id,
                                orderItemId: piece.orderItemId,
                                x: 0,
                                y: 0,
                                width: w,
                                height: h,
                                rotated
                            }],
                        freeRects: []
                    };
                    // Generate free rectangles after first placement (guillotine split)
                    // Right free rectangle
                    if (w + kerf < stock.width) {
                        newSheet.freeRects.push({
                            x: w + kerf,
                            y: 0,
                            width: stock.width - w - kerf,
                            height: stock.height
                        });
                    }
                    // Top free rectangle
                    if (h + kerf < stock.height) {
                        newSheet.freeRects.push({
                            x: 0,
                            y: h + kerf,
                            width: w,
                            height: stock.height - h - kerf
                        });
                    }
                    activeSheets.push(newSheet);
                    stockUsage.set(stock.id, remaining - 1);
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
                    width: piece.width,
                    height: piece.height,
                    quantity: 1,
                    orderItemId: piece.orderItemId,
                    canRotate: piece.canRotate
                });
            }
        }
    }
    // Build results
    let totalWasteArea = 0;
    let totalStockArea = 0;
    let totalUsedArea = 0;
    const results = [];
    for (const sheet of activeSheets) {
        const stockArea = sheet.width * sheet.height;
        const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
        const wasteArea = stockArea - usedArea;
        results.push({
            stockId: sheet.stockId,
            stockWidth: sheet.width,
            stockHeight: sheet.height,
            placements: sheet.placements,
            wasteArea,
            wastePercentage: (wasteArea / stockArea) * 100,
            usedArea
        });
        totalWasteArea += wasteArea;
        totalStockArea += stockArea;
        totalUsedArea += usedArea;
    }
    return {
        success: unplacedPieces.length === 0,
        sheets: results,
        totalWasteArea,
        totalWastePercentage: totalStockArea > 0 ? (totalWasteArea / totalStockArea) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces: expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0),
            totalStockArea,
            totalUsedArea,
            efficiency: totalStockArea > 0 ? (totalUsedArea / totalStockArea) * 100 : 0
        }
    };
}
function tryPlaceGuillotine(sheet, piece, kerf, allowRotation) {
    let bestFitIndex = -1;
    let bestFitScore = Infinity;
    let bestRotated = false;
    let bestWidth = 0;
    let bestHeight = 0;
    for (let i = 0; i < sheet.freeRects.length; i++) {
        const rect = sheet.freeRects[i];
        // Try normal orientation
        if (piece.width <= rect.width && piece.height <= rect.height) {
            const score = Math.min(rect.width - piece.width, rect.height - piece.height);
            if (score < bestFitScore) {
                bestFitScore = score;
                bestFitIndex = i;
                bestRotated = false;
                bestWidth = piece.width;
                bestHeight = piece.height;
            }
        }
        // Try rotated orientation
        if (allowRotation && piece.canRotate && piece.width !== piece.height) {
            if (piece.height <= rect.width && piece.width <= rect.height) {
                const score = Math.min(rect.width - piece.height, rect.height - piece.width);
                if (score < bestFitScore) {
                    bestFitScore = score;
                    bestFitIndex = i;
                    bestRotated = true;
                    bestWidth = piece.height;
                    bestHeight = piece.width;
                }
            }
        }
    }
    if (bestFitIndex === -1)
        return null;
    const rect = sheet.freeRects[bestFitIndex];
    const placement = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        x: rect.x,
        y: rect.y,
        width: bestWidth,
        height: bestHeight,
        rotated: bestRotated
    };
    // Split the free rectangle (guillotine style)
    const newFreeRects = sheet.freeRects.filter((_, i) => i !== bestFitIndex);
    // Right split
    if (bestWidth + kerf < rect.width) {
        newFreeRects.push({
            x: rect.x + bestWidth + kerf,
            y: rect.y,
            width: rect.width - bestWidth - kerf,
            height: rect.height
        });
    }
    // Top split
    if (bestHeight + kerf < rect.height) {
        newFreeRects.push({
            x: rect.x,
            y: rect.y + bestHeight + kerf,
            width: bestWidth,
            height: rect.height - bestHeight - kerf
        });
    }
    return { placement, newFreeRects };
}
/**
 * Main 2D optimization function
 */
function optimize2D(pieces, stockSheets, options) {
    switch (options.algorithm) {
        case 'BOTTOM_LEFT':
            return bottomLeftFill(pieces, stockSheets, options);
        case 'GUILLOTINE':
            return guillotineCutting(pieces, stockSheets, options);
        case 'MAXRECTS':
            // For now, use guillotine as fallback
            return guillotineCutting(pieces, stockSheets, options);
        default:
            return bottomLeftFill(pieces, stockSheets, options);
    }
}
//# sourceMappingURL=cutting2d.js.map