/**
 * 2D Geometry Utilities
 * Rectangle operations and collision detection
 * Single Responsibility: Only handles geometric calculations
 */

import { IRectangle, IPosition, IOrientation } from '../core/types';

// ==================== RECTANGLE OPERATIONS ====================

/**
 * Check if two rectangles overlap
 * Uses separating axis theorem
 */
export function rectanglesOverlap(r1: IRectangle, r2: IRectangle): boolean {
    return !(
        r1.x + r1.width <= r2.x ||
        r2.x + r2.width <= r1.x ||
        r1.y + r1.height <= r2.y ||
        r2.y + r2.height <= r1.y
    );
}

/**
 * Check if rectangle is within bounds
 */
export function isWithinBounds(
    rect: IRectangle,
    bounds: { width: number; height: number }
): boolean {
    return rect.x + rect.width <= bounds.width &&
        rect.y + rect.height <= bounds.height &&
        rect.x >= 0 &&
        rect.y >= 0;
}

/**
 * Create rectangle from position and dimensions
 */
export function createRectangle(pos: IPosition, width: number, height: number): IRectangle {
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
export function expandRectangle(rect: IRectangle, expansion: number): IRectangle {
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
export function calculateArea(rect: IRectangle): number {
    return rect.width * rect.height;
}

// ==================== ORIENTATION ====================

/**
 * Get possible orientations for a piece
 * @param width - Original width
 * @param height - Original height
 * @param canRotate - Whether piece can be rotated
 * @param allowRotation - Global rotation setting
 * @param grainDirection - Grain direction constraint (optional)
 * @param respectGrainDirection - Whether to enforce grain direction (optional)
 */
export function getOrientations(
    width: number,
    height: number,
    canRotate: boolean,
    allowRotation: boolean,
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE',
    respectGrainDirection?: boolean
): IOrientation[] {
    const orientations: IOrientation[] = [
        { width, height, rotated: false }
    ];

    // Check if rotation is allowed
    if (!allowRotation || !canRotate || width === height) {
        return orientations;
    }

    // Check grain direction constraint
    // If grain direction is HORIZONTAL or VERTICAL and we must respect it,
    // rotation would violate the grain direction, so we skip it
    if (respectGrainDirection && grainDirection && grainDirection !== 'NONE') {
        // Rotation would flip horizontal grain to vertical and vice versa
        // So we cannot rotate when grain direction matters
        return orientations;
    }

    // Add rotated option
    orientations.push({ width: height, height: width, rotated: true });

    return orientations;
}

// ==================== POSITION GENERATION ====================

/**
 * Generate candidate positions from existing placements (for Bottom-Left)
 */
export function generateCandidatePositions(
    placements: readonly { x: number; y: number; width: number; height: number }[],
    kerf: number
): IPosition[] {
    const candidates: IPosition[] = [{ x: 0, y: 0 }];

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
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
}
