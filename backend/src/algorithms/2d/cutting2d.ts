/**
 * 2D Cutting Optimization Algorithm
 * Implements Bottom-Left Fill, Guillotine, and Maximal Rectangles algorithms
 */

export interface CuttingPiece2D {
    id: string;
    width: number;
    height: number;
    quantity: number;
    orderItemId: string;
    canRotate: boolean;
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
}

export interface StockSheet2D {
    id: string;
    width: number;
    height: number;
    available: number;
    unitPrice?: number;
}

export interface PlacedPiece2D {
    pieceId: string;
    orderItemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
}

export interface SheetCuttingResult {
    stockId: string;
    stockWidth: number;
    stockHeight: number;
    placements: PlacedPiece2D[];
    wasteArea: number;
    wastePercentage: number;
    usedArea: number;
}

export interface Optimization2DResult {
    success: boolean;
    sheets: SheetCuttingResult[];
    totalWasteArea: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: CuttingPiece2D[];
    statistics: {
        totalPieces: number;
        totalStockArea: number;
        totalUsedArea: number;
        efficiency: number;
    };
}

export interface Optimization2DOptions {
    algorithm: 'BOTTOM_LEFT' | 'GUILLOTINE' | 'MAXRECTS';
    kerf: number;
    allowRotation: boolean;
    guillotineOnly: boolean;
    respectGrainDirection?: boolean;
}

interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ExpandedPiece {
    id: string;
    width: number;
    height: number;
    orderItemId: string;
    originalId: string;
    canRotate: boolean;
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
}

interface ActiveSheet {
    stockId: string;
    width: number;
    height: number;
    placements: PlacedPiece2D[];
    freeRects?: FreeRectangle[]; // For Guillotine
}

interface FreeRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Expand pieces based on quantity
 */
function expandPieces(pieces: CuttingPiece2D[]): ExpandedPiece[] {
    const expanded: ExpandedPiece[] = [];
    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                width: piece.width,
                height: piece.height,
                orderItemId: piece.orderItemId,
                originalId: piece.id,
                canRotate: piece.canRotate,
                grainDirection: piece.grainDirection
            });
        }
    }
    return expanded;
}

/**
 * Check if two rectangles overlap
 */
function rectanglesOverlap(r1: Rectangle, r2: Rectangle): boolean {
    return !(r1.x + r1.width <= r2.x ||
        r2.x + r2.width <= r1.x ||
        r1.y + r1.height <= r2.y ||
        r2.y + r2.height <= r1.y);
}

/**
 * Check if a piece fits at a position without overlapping existing placements
 */
function canPlace(
    rect: Rectangle,
    sheetDims: { width: number, height: number },
    placements: PlacedPiece2D[],
    kerf: number
): boolean {
    // Check bounds
    if (rect.x + rect.width > sheetDims.width || rect.y + rect.height > sheetDims.height) {
        return false;
    }

    // Check overlap with existing placements (considering kerf)
    const newRectWithKerf: Rectangle = { x: rect.x, y: rect.y, width: rect.width + kerf, height: rect.height + kerf };

    for (const placement of placements) {
        const existingRect: Rectangle = {
            x: placement.x,
            y: placement.y,
            width: placement.width + kerf,
            height: placement.height + kerf
        };

        if (rectanglesOverlap(newRectWithKerf, existingRect)) {
            return false;
        }
    }

    return true;
}

/**
 * Helper: Get possible orientations for a piece
 * Respects grainDirection when respectGrainDirection is true
 */
function getOrientations(
    piece: ExpandedPiece,
    allowRotation: boolean,
    respectGrainDirection?: boolean
): Array<{ w: number, h: number, rotated: boolean }> {
    const orientations = [{ w: piece.width, h: piece.height, rotated: false }];

    // Basic checks for rotation
    if (!allowRotation || !piece.canRotate || piece.width === piece.height) {
        return orientations;
    }

    // Check grain direction constraint
    if (respectGrainDirection && piece.grainDirection && piece.grainDirection !== 'NONE') {
        // Cannot rotate when grain direction matters
        return orientations;
    }

    orientations.push({ w: piece.height, h: piece.width, rotated: true });
    return orientations;
}

/**
 * Find the bottom-left position for a piece
 */
function findBottomLeftPosition(
    sheet: { width: number, height: number, placements: PlacedPiece2D[] },
    dims: { w: number, h: number },
    kerf: number
): { x: number; y: number } | null {
    // Generate candidate positions (corners of existing placements + origin)
    const candidates: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];

    for (const p of sheet.placements) {
        candidates.push(
            { x: p.x + p.width + kerf, y: p.y },
            { x: p.x, y: p.y + p.height + kerf },
            { x: p.x + p.width + kerf, y: p.y + p.height + kerf }
        );
    }

    // Sort by y first (bottom), then by x (left)
    candidates.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });

    // Find first valid position
    for (const pos of candidates) {
        const rect = { x: pos.x, y: pos.y, width: dims.w, height: dims.h };
        if (canPlace(rect, { width: sheet.width, height: sheet.height }, sheet.placements, kerf)) {
            return pos;
        }
    }

    return null;
}

/**
 * Try to place a piece in existing active sheets (Bottom-Left)
 */
function tryPlaceInActiveSheetsBL(
    activeSheets: ActiveSheet[],
    piece: ExpandedPiece,
    options: { kerf: number, allowRotation: boolean }
): boolean {
    for (const sheet of activeSheets) {
        const orientations = getOrientations(piece, options.allowRotation);
        for (const orient of orientations) {
            const pos = findBottomLeftPosition(
                { width: sheet.width, height: sheet.height, placements: sheet.placements },
                orient,
                options.kerf
            );

            if (pos) {
                sheet.placements.push({
                    pieceId: piece.id,
                    orderItemId: piece.orderItemId,
                    x: pos.x,
                    y: pos.y,
                    width: orient.w,
                    height: orient.h,
                    rotated: orient.rotated
                });
                return true;
            }
        }
    }
    return false;
}

/**
 * Try to create a new sheet for a piece (Bottom-Left)
 */
function tryCreateNewSheetBL(
    sortedStock: StockSheet2D[],
    stockUsage: Map<string, number>,
    activeSheets: ActiveSheet[],
    piece: ExpandedPiece,
    options: { kerf: number, allowRotation: boolean }
): boolean {
    for (const stock of sortedStock) {
        const remaining = stockUsage.get(stock.id)!;
        if (remaining > 0) {
            const orientations = getOrientations(piece, options.allowRotation);

            for (const orient of orientations) {
                if (orient.w <= stock.width && orient.h <= stock.height) {
                    const newSheet: ActiveSheet = {
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
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Bottom-Left Fill Algorithm
 */
export function bottomLeftFill(
    pieces: CuttingPiece2D[],
    stockSheets: StockSheet2D[],
    options: Optimization2DOptions
): Optimization2DResult {
    const { kerf, allowRotation } = options;

    const expandedPieces = expandPieces(pieces).sort((a, b) =>
        (b.width * b.height) - (a.width * a.height)
    );

    const sortedStock = [...stockSheets]
        .filter(s => s.available > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));

    const activeSheets: ActiveSheet[] = [];
    const unplacedPieces: CuttingPiece2D[] = [];
    const stockUsage: Map<string, number> = new Map();

    for (const stock of sortedStock) {
        stockUsage.set(stock.id, stock.available);
    }

    for (const piece of expandedPieces) {
        let placed = tryPlaceInActiveSheetsBL(activeSheets, piece, { kerf, allowRotation });

        if (!placed) {
            placed = tryCreateNewSheetBL(sortedStock, stockUsage, activeSheets, piece, { kerf, allowRotation });
        }

        if (!placed) {
            const existingUnplaced = unplacedPieces.find(p => p.id === piece.originalId);
            if (existingUnplaced) {
                existingUnplaced.quantity++;
            } else {
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

    return buildResults(activeSheets, expandedPieces, unplacedPieces);
}

/**
 * Guillotine: Try to place piece in sheet
 */
function tryPlaceGuillotineInSheet(
    sheet: ActiveSheet,
    piece: ExpandedPiece,
    kerf: number,
    allowRotation: boolean
): boolean {
    // Only proceed if sheet has freeRects (initialized for guillotine)
    if (!sheet.freeRects) return false;

    let bestFitIndex = -1;
    let bestFitScore = Infinity;
    let bestRotated = false;
    let bestWidth = 0;
    let bestHeight = 0;

    for (let i = 0; i < sheet.freeRects.length; i++) {
        const rect = sheet.freeRects[i];
        const orientations = getOrientations(piece, allowRotation);

        for (const orient of orientations) {
            if (orient.w <= rect.width && orient.h <= rect.height) {
                const score = Math.min(rect.width - orient.w, rect.height - orient.h);
                if (score < bestFitScore) {
                    bestFitScore = score;
                    bestFitIndex = i;
                    bestRotated = orient.rotated;
                    bestWidth = orient.w;
                    bestHeight = orient.h;
                }
            }
        }
    }

    if (bestFitIndex === -1) return false;

    const rect = sheet.freeRects[bestFitIndex];

    // Add placement
    sheet.placements.push({
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        x: rect.x,
        y: rect.y,
        width: bestWidth,
        height: bestHeight,
        rotated: bestRotated
    });

    // Remove used rect and add split rects
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

    sheet.freeRects = newFreeRects;
    return true;
}

/**
 * Helper: Initialize a new sheet for Guillotine packing
 */
function initializeGuillotineSheet(
    stock: StockSheet2D,
    piece: ExpandedPiece,
    orient: { w: number, h: number, rotated: boolean },
    kerf: number
): ActiveSheet {
    const newSheet: ActiveSheet = {
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
        }],
        freeRects: []
    };

    // Initial splits
    if (orient.w + kerf < stock.width) {
        newSheet.freeRects!.push({
            x: orient.w + kerf,
            y: 0,
            width: stock.width - orient.w - kerf,
            height: stock.height
        });
    }
    if (orient.h + kerf < stock.height) {
        newSheet.freeRects!.push({
            x: 0,
            y: orient.h + kerf,
            width: orient.w,
            height: stock.height - orient.h - kerf
        });
    }

    return newSheet;
}

/**
 * Guillotine: Create new sheet logic
 */
function tryCreateNewSheetGuillotine(
    sortedStock: StockSheet2D[],
    stockUsage: Map<string, number>,
    activeSheets: ActiveSheet[],
    piece: ExpandedPiece,
    options: { kerf: number, allowRotation: boolean }
): boolean {
    for (const stock of sortedStock) {
        const remaining = stockUsage.get(stock.id)!;
        if (remaining <= 0) continue;

        const orientations = getOrientations(piece, options.allowRotation);

        for (const orient of orientations) {
            if (orient.w <= stock.width && orient.h <= stock.height) {
                const newSheet = initializeGuillotineSheet(stock, piece, orient, options.kerf);
                activeSheets.push(newSheet);
                stockUsage.set(stock.id, remaining - 1);
                return true;
            }
        }
    }
    return false;
}

/**
 * Guillotine Cutting Algorithm
 */
export function guillotineCutting(
    pieces: CuttingPiece2D[],
    stockSheets: StockSheet2D[],
    options: Optimization2DOptions
): Optimization2DResult {
    const { kerf, allowRotation } = options;

    const expandedPieces = expandPieces(pieces).sort((a, b) =>
        (b.width * b.height) - (a.width * a.height)
    );

    const sortedStock = [...stockSheets]
        .filter(s => s.available > 0)
        .sort((a, b) => (b.width * b.height) - (a.width * a.height));

    const activeSheets: ActiveSheet[] = [];
    const unplacedPieces: CuttingPiece2D[] = [];
    const stockUsage: Map<string, number> = new Map();

    for (const stock of sortedStock) {
        stockUsage.set(stock.id, stock.available);
    }

    for (const piece of expandedPieces) {
        let placed = false;

        // Try existing sheets
        for (const sheet of activeSheets) {
            if (tryPlaceGuillotineInSheet(sheet, piece, kerf, allowRotation)) {
                placed = true;
                break;
            }
        }

        // Get new sheet if not placed
        if (!placed) {
            placed = tryCreateNewSheetGuillotine(sortedStock, stockUsage, activeSheets, piece, { kerf, allowRotation });
        }

        if (!placed) {
            const existingUnplaced = unplacedPieces.find(p => p.id === piece.originalId);
            if (existingUnplaced) {
                existingUnplaced.quantity++;
            } else {
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

    return buildResults(activeSheets, expandedPieces, unplacedPieces);
}

/**
 * Helper: Build results
 */
function buildResults(
    activeSheets: ActiveSheet[],
    expandedPieces: ExpandedPiece[],
    unplacedPieces: CuttingPiece2D[]
): Optimization2DResult {
    let totalWasteArea = 0;
    let totalStockArea = 0;
    let totalUsedArea = 0;
    const results: SheetCuttingResult[] = [];

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
 * Main 2D optimization function
 */
export function optimize2D(
    pieces: CuttingPiece2D[],
    stockSheets: StockSheet2D[],
    options: Optimization2DOptions
): Optimization2DResult {
    switch (options.algorithm) {
        case 'BOTTOM_LEFT':
            return bottomLeftFill(pieces, stockSheets, options);
        case 'GUILLOTINE':
            return guillotineCutting(pieces, stockSheets, options);
        case 'MAXRECTS': {
            // Use enhanced MAXRECTS implementation
            const { optimize2DEnhanced } = require('./enhanced-optimizer');
            const result = optimize2DEnhanced(pieces, stockSheets, {
                algorithm: 'MAXRECTS_BEST',
                kerf: options.kerf,
                allowRotation: options.allowRotation,
                respectGrainDirection: options.respectGrainDirection,
                heuristic: 'BEST'
            });
            return result;
        }
        default:
            return bottomLeftFill(pieces, stockSheets, options);
    }
}
