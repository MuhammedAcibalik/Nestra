/**
 * Piece Expander
 * Expands pieces with quantity into individual units
 * Single Responsibility: Only handles piece expansion
 */

import { IExpanded1DPiece, IExpanded2DPiece } from './types';

// ==================== INPUT INTERFACES ====================

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

// ==================== EXPANDERS ====================

/**
 * Expand 1D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
export function expand1DPieces(pieces: readonly I1DPieceInput[]): IExpanded1DPiece[] {
    const expanded: IExpanded1DPiece[] = [];

    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                originalId: piece.id,
                orderItemId: piece.orderItemId,
                length: piece.length
            });
        }
    }

    return expanded;
}

/**
 * Expand 2D pieces based on quantity
 * @param pieces - Array of pieces with quantity
 * @returns Individual expanded pieces
 */
export function expand2DPieces(pieces: readonly I2DPieceInput[]): IExpanded2DPiece[] {
    const expanded: IExpanded2DPiece[] = [];

    for (const piece of pieces) {
        for (let i = 0; i < piece.quantity; i++) {
            expanded.push({
                id: `${piece.id}_${i}`,
                originalId: piece.id,
                orderItemId: piece.orderItemId,
                width: piece.width,
                height: piece.height,
                canRotate: piece.canRotate
            });
        }
    }

    return expanded;
}

// ==================== SORTING ====================

/**
 * Sort 1D pieces by length (descending)
 * Used by FFD/BFD algorithms
 */
export function sort1DByLengthDesc(pieces: IExpanded1DPiece[]): IExpanded1DPiece[] {
    return [...pieces].sort((a, b) => b.length - a.length);
}

/**
 * Sort 2D pieces by area (descending)
 * Used by 2D algorithms
 */
export function sort2DByAreaDesc(pieces: IExpanded2DPiece[]): IExpanded2DPiece[] {
    return [...pieces].sort((a, b) => b.width * b.height - a.width * a.height);
}
