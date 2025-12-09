/**
 * 1D Cutting Optimization Algorithm
 * Implements First Fit Decreasing (FFD) and Best Fit Decreasing (BFD)
 */
export interface CuttingPiece1D {
    id: string;
    length: number;
    quantity: number;
    orderItemId: string;
    canRotate?: boolean;
}
export interface StockBar1D {
    id: string;
    length: number;
    available: number;
    unitPrice?: number;
}
export interface CutPosition1D {
    pieceId: string;
    orderItemId: string;
    position: number;
    length: number;
}
export interface BarCuttingResult {
    stockId: string;
    stockLength: number;
    cuts: CutPosition1D[];
    waste: number;
    wastePercentage: number;
    usableWaste?: {
        position: number;
        length: number;
    };
}
export interface Optimization1DResult {
    success: boolean;
    bars: BarCuttingResult[];
    totalWaste: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: CuttingPiece1D[];
    statistics: {
        totalPieces: number;
        totalStockLength: number;
        totalUsedLength: number;
        efficiency: number;
    };
}
export interface Optimization1DOptions {
    algorithm: 'FFD' | 'BFD' | 'BRANCH_BOUND';
    kerf: number;
    minUsableWaste: number;
    maxIterations?: number;
}
/**
 * First Fit Decreasing Algorithm
 * Sorts pieces by length (descending) and places each in the first bar that fits
 */
export declare function firstFitDecreasing(pieces: CuttingPiece1D[], stockBars: StockBar1D[], options: Optimization1DOptions): Optimization1DResult;
/**
 * Best Fit Decreasing Algorithm
 * Similar to FFD but places each piece in the bar with the least remaining space
 */
export declare function bestFitDecreasing(pieces: CuttingPiece1D[], stockBars: StockBar1D[], options: Optimization1DOptions): Optimization1DResult;
/**
 * Main optimization function that selects algorithm based on options
 */
export declare function optimize1D(pieces: CuttingPiece1D[], stockBars: StockBar1D[], options: Optimization1DOptions): Optimization1DResult;
//# sourceMappingURL=cutting1d.d.ts.map