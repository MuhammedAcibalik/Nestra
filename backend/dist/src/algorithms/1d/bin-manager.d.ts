/**
 * 1D Bin (Bar) Manager
 * Manages active bars during 1D cutting optimization
 * Single Responsibility: Only handles bar state operations
 */
import { IActiveBar, IExpanded1DPiece, I1DAlgorithmOptions } from '../core/types';
/**
 * Create a new active bar with initial piece
 */
export declare function createActiveBar(stockId: string, stockLength: number, piece: IExpanded1DPiece): IActiveBar;
/**
 * Calculate required length for placing a piece in a bar
 */
export declare function calculateRequiredLength(bar: IActiveBar, pieceLength: number, kerf: number): number;
/**
 * Check if a piece fits in a bar
 */
export declare function canFitInBar(bar: IActiveBar, pieceLength: number, kerf: number): boolean;
/**
 * Place a piece in a bar (mutates bar state)
 */
export declare function placePieceInBar(bar: IActiveBar, piece: IExpanded1DPiece, kerf: number): void;
/**
 * First Fit: Find the first bar that can fit the piece
 */
export declare function findFirstFitBar(activeBars: readonly IActiveBar[], pieceLength: number, kerf: number): IActiveBar | null;
/**
 * Best Fit: Find the bar that leaves minimum remaining space
 */
export declare function findBestFitBar(activeBars: readonly IActiveBar[], pieceLength: number, kerf: number): IActiveBar | null;
/**
 * Calculate usable waste for a bar
 */
export declare function calculateUsableWaste(bar: IActiveBar, options: I1DAlgorithmOptions): {
    position: number;
    length: number;
} | null;
//# sourceMappingURL=bin-manager.d.ts.map