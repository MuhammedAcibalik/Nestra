/**
 * Enhanced 2D Cutting Optimization
 * Integrates all improvements:
 * - MAXRECTS with multiple heuristics
 * - Rectangle merging
 * - Best sheet selection
 * - Multi-pass optimization
 */
import { MaxRectsHeuristic } from './maxrects-algorithm';
export interface IEnhanced2DPiece {
    id: string;
    width: number;
    height: number;
    quantity: number;
    orderItemId: string;
    canRotate: boolean;
    grainDirection?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
}
export interface IEnhanced2DStock {
    id: string;
    width: number;
    height: number;
    available: number;
    unitPrice?: number;
}
export interface IEnhanced2DPlacement {
    pieceId: string;
    orderItemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
}
export interface IEnhanced2DSheetResult {
    stockId: string;
    stockWidth: number;
    stockHeight: number;
    placements: IEnhanced2DPlacement[];
    wasteArea: number;
    wastePercentage: number;
    usedArea: number;
}
export interface IEnhanced2DResult {
    success: boolean;
    sheets: IEnhanced2DSheetResult[];
    totalWasteArea: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: IEnhanced2DPiece[];
    statistics: {
        totalPieces: number;
        totalStockArea: number;
        totalUsedArea: number;
        efficiency: number;
    };
}
export interface IEnhanced2DOptions {
    algorithm: 'MAXRECTS' | 'MAXRECTS_BEST' | 'GUILLOTINE' | 'BOTTOM_LEFT';
    kerf: number;
    allowRotation: boolean;
    respectGrainDirection?: boolean;
    heuristic?: MaxRectsHeuristic;
    multiPass?: boolean;
    sortStrategy?: SortStrategy;
}
export type SortStrategy = 'AREA_DESC' | 'SHORT_SIDE' | 'LONG_SIDE' | 'PERIMETER' | 'DIFFERENCE';
/**
 * Enhanced 2D optimization using MAXRECTS with all improvements
 */
export declare function optimizeEnhanced2D(pieces: IEnhanced2DPiece[], stock: IEnhanced2DStock[], options: IEnhanced2DOptions): IEnhanced2DResult;
/**
 * Drop-in replacement for optimize2D with enhanced algorithms
 */
export declare function optimize2DEnhanced(pieces: IEnhanced2DPiece[], stock: IEnhanced2DStock[], options?: Partial<IEnhanced2DOptions>): IEnhanced2DResult;
//# sourceMappingURL=enhanced-optimizer.d.ts.map