/**
 * Free Rectangle Manager
 * Handles merging, splitting, and optimization of free rectangles
 * Critical for efficient 2D bin packing
 */
export interface IFreeRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Merge all adjacent free rectangles
 * This significantly improves packing efficiency by reducing fragmentation
 */
export declare function mergeFreeRectangles(rects: IFreeRect[]): IFreeRect[];
/**
 * Remove redundant rectangles (those contained by others)
 */
export declare function removeRedundantRects(rects: IFreeRect[]): IFreeRect[];
/**
 * Split a rectangle by removing a placed piece
 * Uses maximal rectangles approach - creates overlapping free rects
 * that maximize usable space
 */
export declare function splitRectMaximal(rect: IFreeRect, placedX: number, placedY: number, placedWidth: number, placedHeight: number, kerf: number): IFreeRect[];
/**
 * Guillotine split - only creates non-overlapping rectangles
 */
export declare function splitRectGuillotine(rect: IFreeRect, placedWidth: number, placedHeight: number, kerf: number, splitHorizontally?: boolean): IFreeRect[];
/**
 * Get total area of all free rectangles
 */
export declare function getTotalFreeArea(rects: IFreeRect[]): number;
/**
 * Sort rectangles by area (descending)
 */
export declare function sortByAreaDesc(rects: IFreeRect[]): IFreeRect[];
/**
 * Sort rectangles by position (bottom-left first)
 */
export declare function sortByPosition(rects: IFreeRect[]): IFreeRect[];
//# sourceMappingURL=free-rect-manager.d.ts.map