/**
 * 2D Geometry Utilities
 * Rectangle operations and collision detection
 * Single Responsibility: Only handles geometric calculations
 */
import { IRectangle, IPosition, IOrientation } from '../core/types';
/**
 * Check if two rectangles overlap
 * Uses separating axis theorem
 */
export declare function rectanglesOverlap(r1: IRectangle, r2: IRectangle): boolean;
/**
 * Check if rectangle is within bounds
 */
export declare function isWithinBounds(rect: IRectangle, bounds: {
    width: number;
    height: number;
}): boolean;
/**
 * Create rectangle from position and dimensions
 */
export declare function createRectangle(pos: IPosition, width: number, height: number): IRectangle;
/**
 * Expand rectangle by kerf (for collision detection)
 */
export declare function expandRectangle(rect: IRectangle, expansion: number): IRectangle;
/**
 * Calculate rectangle area
 */
export declare function calculateArea(rect: IRectangle): number;
/**
 * Get possible orientations for a piece
 * @param width - Original width
 * @param height - Original height
 * @param canRotate - Whether piece can be rotated
 * @param allowRotation - Global rotation setting
 */
export declare function getOrientations(width: number, height: number, canRotate: boolean, allowRotation: boolean): IOrientation[];
/**
 * Generate candidate positions from existing placements (for Bottom-Left)
 */
export declare function generateCandidatePositions(placements: readonly {
    x: number;
    y: number;
    width: number;
    height: number;
}[], kerf: number): IPosition[];
//# sourceMappingURL=geometry.d.ts.map