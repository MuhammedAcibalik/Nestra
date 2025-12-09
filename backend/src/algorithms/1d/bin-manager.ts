/**
 * 1D Bin (Bar) Manager
 * Manages active bars during 1D cutting optimization
 * Single Responsibility: Only handles bar state operations
 */

import { IActiveBar, ICutPosition, IExpanded1DPiece, I1DAlgorithmOptions } from '../core/types';

// ==================== BAR FACTORY ====================

/**
 * Create a new active bar with initial piece
 */
export function createActiveBar(
    stockId: string,
    stockLength: number,
    piece: IExpanded1DPiece
): IActiveBar {
    const cut: ICutPosition = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        position: 0,
        length: piece.length
    };

    return {
        stockId,
        stockLength,
        remainingLength: stockLength - piece.length,
        currentPosition: piece.length,
        cuts: [cut]
    };
}

// ==================== PLACEMENT OPERATIONS ====================

/**
 * Calculate required length for placing a piece in a bar
 */
export function calculateRequiredLength(bar: IActiveBar, pieceLength: number, kerf: number): number {
    const kerfNeeded = bar.cuts.length > 0 ? kerf : 0;
    return pieceLength + kerfNeeded;
}

/**
 * Check if a piece fits in a bar
 */
export function canFitInBar(bar: IActiveBar, pieceLength: number, kerf: number): boolean {
    const required = calculateRequiredLength(bar, pieceLength, kerf);
    return bar.remainingLength >= required;
}

/**
 * Place a piece in a bar (mutates bar state)
 */
export function placePieceInBar(
    bar: IActiveBar,
    piece: IExpanded1DPiece,
    kerf: number
): void {
    const kerfNeeded = bar.cuts.length > 0 ? kerf : 0;
    const position = bar.currentPosition + kerfNeeded;
    const requiredLength = calculateRequiredLength(bar, piece.length, kerf);

    const cut: ICutPosition = {
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        position,
        length: piece.length
    };

    bar.cuts.push(cut);
    bar.currentPosition = position + piece.length;
    bar.remainingLength -= requiredLength;
}

// ==================== BAR SELECTION STRATEGIES ====================

/**
 * First Fit: Find the first bar that can fit the piece
 */
export function findFirstFitBar(
    activeBars: readonly IActiveBar[],
    pieceLength: number,
    kerf: number
): IActiveBar | null {
    for (const bar of activeBars) {
        if (canFitInBar(bar, pieceLength, kerf)) {
            return bar;
        }
    }
    return null;
}

/**
 * Best Fit: Find the bar that leaves minimum remaining space
 */
export function findBestFitBar(
    activeBars: readonly IActiveBar[],
    pieceLength: number,
    kerf: number
): IActiveBar | null {
    let bestBar: IActiveBar | null = null;
    let minRemaining = Infinity;

    for (const bar of activeBars) {
        if (canFitInBar(bar, pieceLength, kerf)) {
            const required = calculateRequiredLength(bar, pieceLength, kerf);
            const remaining = bar.remainingLength - required;

            if (remaining < minRemaining) {
                minRemaining = remaining;
                bestBar = bar;
            }
        }
    }

    return bestBar;
}

// ==================== USABLE WASTE ====================

/**
 * Calculate usable waste for a bar
 */
export function calculateUsableWaste(
    bar: IActiveBar,
    options: I1DAlgorithmOptions
): { position: number; length: number } | null {
    const wasteLength = bar.remainingLength - options.kerf;

    if (wasteLength >= options.minUsableWaste) {
        return {
            position: bar.currentPosition + options.kerf,
            length: wasteLength
        };
    }

    return null;
}
