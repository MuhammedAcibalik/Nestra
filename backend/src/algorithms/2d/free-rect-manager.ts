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

// ==================== MERGING ALGORITHMS ====================

/**
 * Check if two rectangles can be merged horizontally
 * (Same y, same height, adjacent x)
 */
function canMergeHorizontal(r1: IFreeRect, r2: IFreeRect): boolean {
    return r1.y === r2.y &&
        r1.height === r2.height &&
        (r1.x + r1.width === r2.x || r2.x + r2.width === r1.x);
}

/**
 * Check if two rectangles can be merged vertically
 * (Same x, same width, adjacent y)
 */
function canMergeVertical(r1: IFreeRect, r2: IFreeRect): boolean {
    return r1.x === r2.x &&
        r1.width === r2.width &&
        (r1.y + r1.height === r2.y || r2.y + r2.height === r1.y);
}

/**
 * Merge two horizontally adjacent rectangles
 */
function mergeHorizontal(r1: IFreeRect, r2: IFreeRect): IFreeRect {
    const minX = Math.min(r1.x, r2.x);
    return {
        x: minX,
        y: r1.y,
        width: r1.width + r2.width,
        height: r1.height
    };
}

/**
 * Merge two vertically adjacent rectangles
 */
function mergeVertical(r1: IFreeRect, r2: IFreeRect): IFreeRect {
    const minY = Math.min(r1.y, r2.y);
    return {
        x: r1.x,
        y: minY,
        width: r1.width,
        height: r1.height + r2.height
    };
}

/**
 * Merge all adjacent free rectangles
 * This significantly improves packing efficiency by reducing fragmentation
 */
export function mergeFreeRectangles(rects: IFreeRect[]): IFreeRect[] {
    if (rects.length < 2) return rects;

    let result = [...rects];
    let merged = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (merged && iterations < maxIterations) {
        merged = false;
        iterations++;

        for (let i = 0; i < result.length && !merged; i++) {
            for (let j = i + 1; j < result.length && !merged; j++) {
                if (canMergeHorizontal(result[i], result[j])) {
                    const mergedRect = mergeHorizontal(result[i], result[j]);
                    result = result.filter((_, idx) => idx !== i && idx !== j);
                    result.push(mergedRect);
                    merged = true;
                } else if (canMergeVertical(result[i], result[j])) {
                    const mergedRect = mergeVertical(result[i], result[j]);
                    result = result.filter((_, idx) => idx !== i && idx !== j);
                    result.push(mergedRect);
                    merged = true;
                }
            }
        }
    }

    return result;
}

// ==================== CONTAINMENT CHECK ====================

/**
 * Check if r1 is completely contained within r2
 */
function isContained(r1: IFreeRect, r2: IFreeRect): boolean {
    return r1.x >= r2.x &&
        r1.y >= r2.y &&
        r1.x + r1.width <= r2.x + r2.width &&
        r1.y + r1.height <= r2.y + r2.height;
}

/**
 * Remove redundant rectangles (those contained by others)
 */
export function removeRedundantRects(rects: IFreeRect[]): IFreeRect[] {
    return rects.filter((r1, i) => {
        return !rects.some((r2, j) => i !== j && isContained(r1, r2));
    });
}

// ==================== SPLITTING ====================

/**
 * Split a rectangle by removing a placed piece
 * Uses maximal rectangles approach - creates overlapping free rects
 * that maximize usable space
 */
export function splitRectMaximal(
    rect: IFreeRect,
    placedX: number,
    placedY: number,
    placedWidth: number,
    placedHeight: number,
    kerf: number
): IFreeRect[] {
    const splits: IFreeRect[] = [];
    const pRight = placedX + placedWidth + kerf;
    const pTop = placedY + placedHeight + kerf;

    // Left of placed piece (full height of original rect)
    if (placedX > rect.x + kerf) {
        const leftWidth = placedX - rect.x - kerf;
        if (leftWidth > 0) {
            splits.push({
                x: rect.x,
                y: rect.y,
                width: leftWidth,
                height: rect.height
            });
        }
    }

    // Right of placed piece (full height of original rect)
    if (pRight < rect.x + rect.width) {
        const rightWidth = rect.x + rect.width - pRight;
        if (rightWidth > 0) {
            splits.push({
                x: pRight,
                y: rect.y,
                width: rightWidth,
                height: rect.height
            });
        }
    }

    // Below placed piece (full width of original rect)
    if (placedY > rect.y + kerf) {
        const bottomHeight = placedY - rect.y - kerf;
        if (bottomHeight > 0) {
            splits.push({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: bottomHeight
            });
        }
    }

    // Above placed piece (full width of original rect)
    if (pTop < rect.y + rect.height) {
        const topHeight = rect.y + rect.height - pTop;
        if (topHeight > 0) {
            splits.push({
                x: rect.x,
                y: pTop,
                width: rect.width,
                height: topHeight
            });
        }
    }

    // Filter out invalid rectangles (too small)
    return splits.filter(r => r.width > 10 && r.height > 10);
}

/**
 * Guillotine split - only creates non-overlapping rectangles
 */
export function splitRectGuillotine(
    rect: IFreeRect,
    placedWidth: number,
    placedHeight: number,
    kerf: number,
    splitHorizontally: boolean = true
): IFreeRect[] {
    const splits: IFreeRect[] = [];

    if (splitHorizontally) {
        // Right split (full height)
        if (placedWidth + kerf < rect.width) {
            splits.push({
                x: rect.x + placedWidth + kerf,
                y: rect.y,
                width: rect.width - placedWidth - kerf,
                height: rect.height
            });
        }
        // Top split (only width of placed piece)
        if (placedHeight + kerf < rect.height) {
            splits.push({
                x: rect.x,
                y: rect.y + placedHeight + kerf,
                width: placedWidth,
                height: rect.height - placedHeight - kerf
            });
        }
    } else {
        // Top split (full width)
        if (placedHeight + kerf < rect.height) {
            splits.push({
                x: rect.x,
                y: rect.y + placedHeight + kerf,
                width: rect.width,
                height: rect.height - placedHeight - kerf
            });
        }
        // Right split (only height of placed piece)
        if (placedWidth + kerf < rect.width) {
            splits.push({
                x: rect.x + placedWidth + kerf,
                y: rect.y,
                width: rect.width - placedWidth - kerf,
                height: placedHeight
            });
        }
    }

    return splits.filter(r => r.width > 0 && r.height > 0);
}

// ==================== UTILITIES ====================

/**
 * Get total area of all free rectangles
 */
export function getTotalFreeArea(rects: IFreeRect[]): number {
    return rects.reduce((sum, r) => sum + r.width * r.height, 0);
}

/**
 * Sort rectangles by area (descending)
 */
export function sortByAreaDesc(rects: IFreeRect[]): IFreeRect[] {
    return [...rects].sort((a, b) => (b.width * b.height) - (a.width * a.height));
}

/**
 * Sort rectangles by position (bottom-left first)
 */
export function sortByPosition(rects: IFreeRect[]): IFreeRect[] {
    return [...rects].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
}
