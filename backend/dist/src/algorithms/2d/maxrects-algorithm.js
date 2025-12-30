"use strict";
/**
 * MAXRECTS Algorithm Implementation
 * The most efficient 2D bin packing algorithm
 * Uses maximal rectangles with multiple placement heuristics
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBestPlacement = findBestPlacement;
exports.findBestPlacementAllHeuristics = findBestPlacementAllHeuristics;
exports.placePieceMaxRects = placePieceMaxRects;
exports.createMaxRectsSheet = createMaxRectsSheet;
exports.initializeMaxRectsSheet = initializeMaxRectsSheet;
exports.tryPlaceInSheet = tryPlaceInSheet;
exports.selectBestSheet = selectBestSheet;
const free_rect_manager_1 = require("./free-rect-manager");
/**
 * Best Short Side Fit (BSSF)
 * Prefers positions where short side of remaining space is minimized
 */
function scoreBSSF(rect, pieceWidth, pieceHeight) {
    const leftoverX = rect.width - pieceWidth;
    const leftoverY = rect.height - pieceHeight;
    return Math.min(leftoverX, leftoverY);
}
/**
 * Best Area Fit (BAF)
 * Prefers positions where remaining area is minimized
 */
function scoreBAF(rect, pieceWidth, pieceHeight) {
    return rect.width * rect.height - pieceWidth * pieceHeight;
}
/**
 * Best Long Side Fit (BLSF)
 * Prefers positions where long side of remaining space is minimized
 */
function scoreBLSF(rect, pieceWidth, pieceHeight) {
    const leftoverX = rect.width - pieceWidth;
    const leftoverY = rect.height - pieceHeight;
    return Math.max(leftoverX, leftoverY);
}
/**
 * Bottom-Left (BL)
 * Prefers positions closer to bottom-left corner
 */
function scoreBL(rect) {
    return rect.y * 10000 + rect.x;
}
/**
 * Contact Point (CP)
 * Prefers positions with more contact with edges or other pieces
 */
function scoreCP(rect, pieceWidth, pieceHeight, sheetWidth, sheetHeight) {
    let score = 0;
    // Left edge contact
    if (rect.x === 0)
        score += pieceHeight;
    // Bottom edge contact
    if (rect.y === 0)
        score += pieceWidth;
    // Right edge contact (touching sheet edge)
    if (rect.x + pieceWidth === sheetWidth)
        score += pieceHeight;
    // Top edge contact (touching sheet edge)
    if (rect.y + pieceHeight === sheetHeight)
        score += pieceWidth;
    return -score; // Negative because we want to maximize contact
}
// ==================== ORIENTATION HELPER ====================
function getOrientations(piece, allowRotation, respectGrainDirection) {
    const orientations = [{ width: piece.width, height: piece.height, rotated: false }];
    if (!allowRotation || !piece.canRotate || piece.width === piece.height) {
        return orientations;
    }
    if (respectGrainDirection && piece.grainDirection && piece.grainDirection !== 'NONE') {
        return orientations;
    }
    orientations.push({ width: piece.height, height: piece.width, rotated: true });
    return orientations;
}
// ==================== MAIN ALGORITHM ====================
/**
 * Find best placement for a piece in a sheet using specified heuristic
 */
function findBestPlacement(sheet, piece, options) {
    const orientations = getOrientations(piece, options.allowRotation, options.respectGrainDirection);
    let bestCandidate = null;
    for (let i = 0; i < sheet.freeRects.length; i++) {
        const rect = sheet.freeRects[i];
        for (const orient of orientations) {
            if (orient.width <= rect.width && orient.height <= rect.height) {
                let score;
                switch (options.heuristic ?? 'BSSF') {
                    case 'BSSF':
                        score = scoreBSSF(rect, orient.width, orient.height);
                        break;
                    case 'BAF':
                        score = scoreBAF(rect, orient.width, orient.height);
                        break;
                    case 'BLSF':
                        score = scoreBLSF(rect, orient.width, orient.height);
                        break;
                    case 'BL':
                        score = scoreBL(rect);
                        break;
                    case 'CP':
                        score = scoreCP(rect, orient.width, orient.height, sheet.width, sheet.height);
                        break;
                    case 'BEST':
                        // Use combination of metrics
                        score =
                            scoreBSSF(rect, orient.width, orient.height) * 0.5 +
                                scoreBAF(rect, orient.width, orient.height) * 0.3 +
                                scoreBL(rect) * 0.0001;
                        break;
                    default:
                        score = scoreBSSF(rect, orient.width, orient.height);
                }
                if (!bestCandidate || score < bestCandidate.score) {
                    bestCandidate = {
                        rectIndex: i,
                        x: rect.x,
                        y: rect.y,
                        width: orient.width,
                        height: orient.height,
                        rotated: orient.rotated,
                        score
                    };
                }
            }
        }
    }
    return bestCandidate;
}
/**
 * Find best placement trying all heuristics
 */
function findBestPlacementAllHeuristics(sheet, piece, options) {
    const heuristics = ['BSSF', 'BAF', 'BLSF', 'BL', 'CP'];
    let overallBest = null;
    for (const heuristic of heuristics) {
        const candidate = findBestPlacement(sheet, piece, { ...options, heuristic });
        if (candidate && (!overallBest || candidate.score < overallBest.score)) {
            overallBest = candidate;
        }
    }
    return overallBest;
}
/**
 * Place a piece in a sheet and update free rectangles
 */
function placePieceMaxRects(sheet, piece, candidate, kerf) {
    // Add placement
    sheet.placements.push({
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
        rotated: candidate.rotated
    });
    // Update free rectangles using maximal rectangles approach
    const newFreeRects = [];
    for (const rect of sheet.freeRects) {
        // Check if placement intersects this free rect
        const placedRight = candidate.x + candidate.width + kerf;
        const placedTop = candidate.y + candidate.height + kerf;
        // No intersection
        if (candidate.x >= rect.x + rect.width ||
            placedRight <= rect.x ||
            candidate.y >= rect.y + rect.height ||
            placedTop <= rect.y) {
            newFreeRects.push(rect);
            continue;
        }
        // Split the intersected rectangle
        const splits = (0, free_rect_manager_1.splitRectMaximal)(rect, Math.max(candidate.x, rect.x), Math.max(candidate.y, rect.y), candidate.width, candidate.height, kerf);
        newFreeRects.push(...splits);
    }
    // Merge adjacent rectangles and remove redundant ones
    let optimized = (0, free_rect_manager_1.mergeFreeRectangles)(newFreeRects);
    optimized = (0, free_rect_manager_1.removeRedundantRects)(optimized);
    sheet.freeRects = optimized;
}
/**
 * Create a new MAXRECTS sheet
 */
function createMaxRectsSheet(stockId, width, height) {
    return {
        stockId,
        width,
        height,
        freeRects: [{ x: 0, y: 0, width, height }],
        placements: []
    };
}
/**
 * Initialize sheet with first piece
 */
function initializeMaxRectsSheet(stockId, width, height, piece, rotated, kerf) {
    const sheet = createMaxRectsSheet(stockId, width, height);
    const pieceWidth = rotated ? piece.height : piece.width;
    const pieceHeight = rotated ? piece.width : piece.height;
    const candidate = {
        rectIndex: 0,
        x: 0,
        y: 0,
        width: pieceWidth,
        height: pieceHeight,
        rotated,
        score: 0
    };
    placePieceMaxRects(sheet, piece, candidate, kerf);
    return sheet;
}
/**
 * Try to place piece in existing sheet
 */
function tryPlaceInSheet(sheet, piece, options) {
    const candidate = options.heuristic === 'BEST'
        ? findBestPlacementAllHeuristics(sheet, piece, options)
        : findBestPlacement(sheet, piece, options);
    if (!candidate)
        return false;
    placePieceMaxRects(sheet, piece, candidate, options.kerf);
    return true;
}
// ==================== SHEET SELECTION ====================
/**
 * Select best sheet for placing a piece
 * Returns the sheet that would result in minimum waste
 */
function selectBestSheet(sheets, piece, options) {
    let best = null;
    for (const sheet of sheets) {
        const candidate = options.heuristic === 'BEST'
            ? findBestPlacementAllHeuristics(sheet, piece, options)
            : findBestPlacement(sheet, piece, options);
        if (candidate) {
            // Calculate waste score (lower is better)
            const usedArea = sheet.placements.reduce((sum, p) => sum + p.width * p.height, 0);
            const pieceArea = candidate.width * candidate.height;
            const totalArea = sheet.width * sheet.height;
            const wasteScore = (totalArea - usedArea - pieceArea) / totalArea;
            if (!best || wasteScore < best.wasteScore) {
                best = { sheet, candidate, wasteScore };
            }
        }
    }
    return best ? { sheet: best.sheet, candidate: best.candidate } : null;
}
//# sourceMappingURL=maxrects-algorithm.js.map