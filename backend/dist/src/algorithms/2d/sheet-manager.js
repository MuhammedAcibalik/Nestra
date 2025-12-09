"use strict";
/**
 * 2D Sheet Manager
 * Manages active sheets during 2D cutting optimization
 * Single Responsibility: Only handles sheet state operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createActiveSheet = createActiveSheet;
exports.createGuillotineSheet = createGuillotineSheet;
exports.canPlaceAt = canPlaceAt;
exports.findBottomLeftPosition = findBottomLeftPosition;
exports.tryPlaceBottomLeft = tryPlaceBottomLeft;
exports.findBestGuillotineFit = findBestGuillotineFit;
exports.splitFreeRectangle = splitFreeRectangle;
exports.tryPlaceGuillotine = tryPlaceGuillotine;
const geometry_1 = require("./geometry");
// ==================== SHEET FACTORY ====================
/**
 * Create a new active sheet with initial piece at origin
 */
function createActiveSheet(stockId, stockWidth, stockHeight, piece, rotated) {
    const width = rotated ? piece.height : piece.width;
    const height = rotated ? piece.width : piece.height;
    const placement = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        x: 0,
        y: 0,
        width,
        height,
        rotated
    };
    return {
        stockId,
        width: stockWidth,
        height: stockHeight,
        placements: [placement]
    };
}
/**
 * Create a new sheet with guillotine tracking
 */
function createGuillotineSheet(stockId, stockWidth, stockHeight, piece, rotated, kerf) {
    const width = rotated ? piece.height : piece.width;
    const height = rotated ? piece.width : piece.height;
    const sheet = createActiveSheet(stockId, stockWidth, stockHeight, piece, rotated);
    // Initialize free rectangles
    sheet.freeRects = [];
    // Right split
    if (width + kerf < stockWidth) {
        sheet.freeRects.push({
            x: width + kerf,
            y: 0,
            width: stockWidth - width - kerf,
            height: stockHeight
        });
    }
    // Top split
    if (height + kerf < stockHeight) {
        sheet.freeRects.push({
            x: 0,
            y: height + kerf,
            width: width,
            height: stockHeight - height - kerf
        });
    }
    return sheet;
}
// ==================== PLACEMENT VALIDATION ====================
/**
 * Check if a piece can be placed at a position
 */
function canPlaceAt(sheet, pos, width, height, kerf) {
    const newRect = (0, geometry_1.createRectangle)(pos, width, height);
    // Check bounds
    if (!(0, geometry_1.isWithinBounds)(newRect, { width: sheet.width, height: sheet.height })) {
        return false;
    }
    // Check overlap with existing placements (with kerf)
    const newRectWithKerf = (0, geometry_1.expandRectangle)(newRect, kerf);
    for (const placement of sheet.placements) {
        const existingRect = (0, geometry_1.expandRectangle)((0, geometry_1.createRectangle)({ x: placement.x, y: placement.y }, placement.width, placement.height), kerf);
        if ((0, geometry_1.rectanglesOverlap)(newRectWithKerf, existingRect)) {
            return false;
        }
    }
    return true;
}
// ==================== BOTTOM-LEFT PLACEMENT ====================
/**
 * Find bottom-left position for a piece in a sheet
 */
function findBottomLeftPosition(sheet, width, height, kerf) {
    const candidates = (0, geometry_1.generateCandidatePositions)(sheet.placements, kerf);
    for (const pos of candidates) {
        if (canPlaceAt(sheet, pos, width, height, kerf)) {
            return pos;
        }
    }
    return null;
}
/**
 * Try to place piece in sheet using Bottom-Left strategy
 */
function tryPlaceBottomLeft(sheet, piece, options) {
    const orientations = (0, geometry_1.getOrientations)(piece.width, piece.height, piece.canRotate, options.allowRotation);
    for (const orient of orientations) {
        const pos = findBottomLeftPosition(sheet, orient.width, orient.height, options.kerf);
        if (pos) {
            sheet.placements.push({
                pieceId: piece.id,
                orderItemId: piece.orderItemId,
                x: pos.x,
                y: pos.y,
                width: orient.width,
                height: orient.height,
                rotated: orient.rotated
            });
            return true;
        }
    }
    return false;
}
// ==================== GUILLOTINE PLACEMENT ====================
/**
 * Find best fit rectangle for guillotine placement
 */
function findBestGuillotineFit(freeRects, width, height, canRotate, allowRotation) {
    let bestIndex = -1;
    let bestScore = Infinity;
    let bestWidth = 0;
    let bestHeight = 0;
    let bestRotated = false;
    const orientations = (0, geometry_1.getOrientations)(width, height, canRotate, allowRotation);
    for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i];
        for (const orient of orientations) {
            if (orient.width <= rect.width && orient.height <= rect.height) {
                // Best short side fit score
                const score = Math.min(rect.width - orient.width, rect.height - orient.height);
                if (score < bestScore) {
                    bestScore = score;
                    bestIndex = i;
                    bestWidth = orient.width;
                    bestHeight = orient.height;
                    bestRotated = orient.rotated;
                }
            }
        }
    }
    if (bestIndex === -1)
        return null;
    return { index: bestIndex, width: bestWidth, height: bestHeight, rotated: bestRotated };
}
/**
 * Split free rectangle after placement (guillotine)
 */
function splitFreeRectangle(rect, placedWidth, placedHeight, kerf) {
    const splits = [];
    // Right split
    if (placedWidth + kerf < rect.width) {
        splits.push({
            x: rect.x + placedWidth + kerf,
            y: rect.y,
            width: rect.width - placedWidth - kerf,
            height: rect.height
        });
    }
    // Top split
    if (placedHeight + kerf < rect.height) {
        splits.push({
            x: rect.x,
            y: rect.y + placedHeight + kerf,
            width: placedWidth,
            height: rect.height - placedHeight - kerf
        });
    }
    return splits;
}
/**
 * Try to place piece in sheet using Guillotine strategy
 */
function tryPlaceGuillotine(sheet, piece, options) {
    if (!sheet.freeRects || sheet.freeRects.length === 0)
        return false;
    const fit = findBestGuillotineFit(sheet.freeRects, piece.width, piece.height, piece.canRotate, options.allowRotation);
    if (!fit)
        return false;
    const rect = sheet.freeRects[fit.index];
    // Add placement
    sheet.placements.push({
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        x: rect.x,
        y: rect.y,
        width: fit.width,
        height: fit.height,
        rotated: fit.rotated
    });
    // Update free rectangles
    const newRects = sheet.freeRects.filter((_, i) => i !== fit.index);
    const splits = splitFreeRectangle(rect, fit.width, fit.height, options.kerf);
    sheet.freeRects = [...newRects, ...splits];
    return true;
}
//# sourceMappingURL=sheet-manager.js.map