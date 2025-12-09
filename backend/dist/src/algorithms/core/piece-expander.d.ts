/**
 * Piece Expander
 * Expands pieces with quantity into individual units
 * Single Responsibility: Only handles piece expansion
 */
import { IExpanded1DPiece, IExpanded2DPiece } from './types';
/**
 * 1D piece input (with quantity)
 */
export interface I1DPieceInput {
    readonly id: string;
    readonly length: number;
    readonly quantity: number;
    readonly orderItemId: string;
}
/**
 * 2D piece input (with quantity)
 */
export interface I2DPieceInput {
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly quantity: number;
    readonly orderItemId: string;
    readonly canRotate: boolean;
}
/**
 * Expand 1D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
export declare function expand1DPieces(pieces: readonly I1DPieceInput[]): IExpanded1DPiece[];
/**
 * Expand 2D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
export declare function expand2DPieces(pieces: readonly I2DPieceInput[]): IExpanded2DPiece[];
/**
 * Sort 1D pieces by length (descending)
 * Used by FFD/BFD algorithms
 */
export declare function sort1DByLengthDesc(pieces: IExpanded1DPiece[]): IExpanded1DPiece[];
/**
 * Sort 2D pieces by area (descending)
 * Used by 2D algorithms
 */
export declare function sort2DByAreaDesc(pieces: IExpanded2DPiece[]): IExpanded2DPiece[];
//# sourceMappingURL=piece-expander.d.ts.map