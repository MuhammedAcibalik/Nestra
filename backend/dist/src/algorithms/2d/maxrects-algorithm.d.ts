/**
 * MAXRECTS Algorithm Implementation
 * The most efficient 2D bin packing algorithm
 * Uses maximal rectangles with multiple placement heuristics
 */
import { IFreeRect } from './free-rect-manager';
export interface IMaxRectsSheet {
    stockId: string;
    width: number;
    height: number;
    freeRects: IFreeRect[];
    placements: IMaxRectsPlacement[];
}
export interface IMaxRectsPlacement {
    pieceId: string;
    orderItemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
}
export interface IMaxRectsPiece {
    id: string;
    width: number;
    height: number;
    orderItemId: string;
    canRotate: boolean;
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
}
export interface IMaxRectsOptions {
    kerf: number;
    allowRotation: boolean;
    respectGrainDirection?: boolean;
    heuristic?: MaxRectsHeuristic;
}
export type MaxRectsHeuristic = 'BSSF' | 'BAF' | 'BLSF' | 'BL' | 'CP' | 'BEST';
interface PlacementCandidate {
    rectIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    score: number;
}
/**
 * Find best placement for a piece in a sheet using specified heuristic
 */
export declare function findBestPlacement(sheet: IMaxRectsSheet, piece: IMaxRectsPiece, options: IMaxRectsOptions): PlacementCandidate | null;
/**
 * Find best placement trying all heuristics
 */
export declare function findBestPlacementAllHeuristics(sheet: IMaxRectsSheet, piece: IMaxRectsPiece, options: IMaxRectsOptions): PlacementCandidate | null;
/**
 * Place a piece in a sheet and update free rectangles
 */
export declare function placePieceMaxRects(sheet: IMaxRectsSheet, piece: IMaxRectsPiece, candidate: PlacementCandidate, kerf: number): void;
/**
 * Create a new MAXRECTS sheet
 */
export declare function createMaxRectsSheet(stockId: string, width: number, height: number): IMaxRectsSheet;
/**
 * Initialize sheet with first piece
 */
export declare function initializeMaxRectsSheet(stockId: string, width: number, height: number, piece: IMaxRectsPiece, rotated: boolean, kerf: number): IMaxRectsSheet;
/**
 * Try to place piece in existing sheet
 */
export declare function tryPlaceInSheet(sheet: IMaxRectsSheet, piece: IMaxRectsPiece, options: IMaxRectsOptions): boolean;
/**
 * Select best sheet for placing a piece
 * Returns the sheet that would result in minimum waste
 */
export declare function selectBestSheet(sheets: IMaxRectsSheet[], piece: IMaxRectsPiece, options: IMaxRectsOptions): {
    sheet: IMaxRectsSheet;
    candidate: PlacementCandidate;
} | null;
export {};
//# sourceMappingURL=maxrects-algorithm.d.ts.map