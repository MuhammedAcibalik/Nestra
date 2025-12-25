/**
 * First Fit Decreasing (FFD) Algorithm
 * Places pieces in the first bar that fits
 * Following Strategy Pattern - implements I1DAlgorithm interface
 */

import { I1DAlgorithmOptions, IActiveBar } from '../core/types';
import { I1DPieceInput, expand1DPieces, sort1DByLengthDesc } from '../core/piece-expander';
import { Stock1DManager, I1DStockInput } from '../core/stock-manager';
import { createActiveBar, placePieceInBar, findFirstFitBar } from './bin-manager';
import { UnplacedCollector1D } from './unplaced-collector';
import { I1DOptimizationResult, buildResult } from './result-builder';

// ==================== FFD ALGORITHM ====================

/**
 * First Fit Decreasing Algorithm
 *
 * Strategy:
 * 1. Sort pieces by length (descending)
 * 2. For each piece, find the first bar that can fit it
 * 3. If no bar fits, create a new bar
 *
 * Complexity: O(n * m) where n = pieces, m = bars
 */
export function firstFitDecreasing(
    pieces: readonly I1DPieceInput[],
    stock: readonly I1DStockInput[],
    options: I1DAlgorithmOptions
): I1DOptimizationResult {
    // Expand and sort pieces
    const expandedPieces = sort1DByLengthDesc(expand1DPieces(pieces));

    // Initialize managers
    const stockManager = new Stock1DManager(stock, 'DESC');
    const unplaced = new UnplacedCollector1D();
    const activeBars: IActiveBar[] = [];

    // Process each piece
    for (const piece of expandedPieces) {
        let placed = false;

        // Try to fit in existing bar (First Fit)
        const bar = findFirstFitBar(activeBars, piece.length, options.kerf);

        if (bar) {
            placePieceInBar(bar, piece, options.kerf);
            placed = true;
        }

        // If not placed, try to get new bar from stock
        if (!placed) {
            const availableStock = stockManager.findAvailableStock(piece.length);

            if (availableStock) {
                const newBar = createActiveBar(availableStock.id, availableStock.length, piece);
                activeBars.push(newBar);
                stockManager.consumeStock(availableStock.id);
                placed = true;
            }
        }

        // Track unplaced pieces
        if (!placed) {
            unplaced.add(piece);
        }
    }

    return buildResult(activeBars, unplaced.getAll(), expandedPieces.length, options);
}

// ==================== ALGORITHM METADATA ====================

export const FFD_ALGORITHM = {
    name: '1D_FFD',
    type: '1D' as const,
    description: 'First Fit Decreasing - Places pieces in first available bar'
};
