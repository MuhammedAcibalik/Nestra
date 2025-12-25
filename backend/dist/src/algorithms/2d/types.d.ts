/**
 * 2D Cutting Algorithm Types
 * Shared types for all 2D cutting algorithms
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
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface ExpandedPiece {
    id: string;
    width: number;
    height: number;
    orderItemId: string;
    originalId: string;
    canRotate: boolean;
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
}
export interface ActiveSheet {
    stockId: string;
    width: number;
    height: number;
    placements: PlacedPiece2D[];
    freeRects?: FreeRectangle[];
}
export interface FreeRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * 2D Cutting Strategy Interface
 */
export interface ICutting2DStrategy {
    name: string;
    optimize(pieces: CuttingPiece2D[], stockSheets: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
}
//# sourceMappingURL=types.d.ts.map