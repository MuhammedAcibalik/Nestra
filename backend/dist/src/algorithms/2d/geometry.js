"use strict";
/**
 * 2D Geometry Utilities
 * Rectangle operations and collision detection
 * Single Responsibility: Only handles geometric calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rectanglesOverlap = rectanglesOverlap;
exports.isWithinBounds = isWithinBounds;
exports.createRectangle = createRectangle;
exports.expandRectangle = expandRectangle;
exports.calculateArea = calculateArea;
exports.getOrientations = getOrientations;
exports.generateCandidatePositions = generateCandidatePositions;
// ==================== RECTANGLE OPERATIONS ====================
/**
 * Check if two rectangles overlap
 * Uses separating axis theorem
 */
function rectanglesOverlap(r1, r2) {
    return !(r1.x + r1.width <= r2.x ||
        r2.x + r2.width <= r1.x ||
        r1.y + r1.height <= r2.y ||
        r2.y + r2.height <= r1.y);
}
/**
 * Check if rectangle is within bounds
 */
function isWithinBounds(rect, bounds) {
    return rect.x + rect.width <= bounds.width &&
        rect.y + rect.height <= bounds.height &&
        rect.x >= 0 &&
        rect.y >= 0;
}
/**
 * Create rectangle from position and dimensions
 */
function createRectangle(pos, width, height) {
    return {
        x: pos.x,
        y: pos.y,
        width,
        height
    };
}
/**
 * Expand rectangle by kerf (for collision detection)
 */
function expandRectangle(rect, expansion) {
    return {
        x: rect.x,
        y: rect.y,
        width: rect.width + expansion,
        height: rect.height + expansion
    };
}
/**
 * Calculate rectangle area
 */
function calculateArea(rect) {
    return rect.width * rect.height;
}
// ==================== ORIENTATION ====================
/**
 * Get possible orientations for a piece
 * @param width - Original width
 * @param height - Original height
 * @param canRotate - Whether piece can be rotated
 * @param allowRotation - Global rotation setting
 */
function getOrientations(width, height, canRotate, allowRotation) {
    const orientations = [
        { width, height, rotated: false }
    ];
    // Add rotated option if allowed and dimensions are different
    if (allowRotation && canRotate && width !== height) {
        orientations.push({ width: height, height: width, rotated: true });
    }
    return orientations;
}
// ==================== POSITION GENERATION ====================
/**
 * Generate candidate positions from existing placements (for Bottom-Left)
 */
function generateCandidatePositions(placements, kerf) {
    const candidates = [{ x: 0, y: 0 }];
    for (const p of placements) {
        // Right side of placement
        candidates.push({ x: p.x + p.width + kerf, y: p.y });
        // Top side of placement
        candidates.push({ x: p.x, y: p.y + p.height + kerf });
        // Diagonal corner
        candidates.push({ x: p.x + p.width + kerf, y: p.y + p.height + kerf });
    }
    // Sort by y (bottom first), then x (left first)
    return candidates.sort((a, b) => {
        if (a.y !== b.y)
            return a.y - b.y;
        return a.x - b.x;
    });
}
//# sourceMappingURL=geometry.js.map