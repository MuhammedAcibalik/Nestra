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
/**
 * Bottom-Left Fill Algorithm
 */
export declare function bottomLeftFill(pieces: CuttingPiece2D[], stockSheets: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
/**
 * Guillotine Cutting Algorithm
 */
export declare function guillotineCutting(pieces: CuttingPiece2D[], stockSheets: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
/**
 * Main 2D optimization function
 */
export declare function optimize2D(pieces: CuttingPiece2D[], stockSheets: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
//# sourceMappingURL=cutting2d.d.ts.map