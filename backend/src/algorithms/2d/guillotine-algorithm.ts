/**
 * Guillotine Cutting Algorithm
 * Splits sheets using guillotine cuts (full-length horizontal/vertical cuts)
 */

import { IActiveSheet, I2DAlgorithmOptions } from '../core/types';
import { I2DPieceInput, expand2DPieces, sort2DByAreaDesc } from '../core/piece-expander';
import { Stock2DManager, I2DStockInput } from '../core/stock-manager';
import { getOrientations } from './geometry';
import { createGuillotineSheet, tryPlaceGuillotine } from './sheet-manager';
import { UnplacedCollector2D } from './unplaced-collector';
import { I2DOptimizationResult, buildResult } from './result-builder';

// ==================== GUILLOTINE ALGORITHM ====================

/**
 * Guillotine Cutting Algorithm
 * 
 * Strategy:
 * 1. Sort pieces by area (descending)
 * 2. Track free rectangles in each sheet
 * 3. Use best short side fit for placement
 * 4. Split remaining area with guillotine cuts
 */
export function guillotineCutting(
    pieces: readonly I2DPieceInput[],
    stock: readonly I2DStockInput[],
    options: I2DAlgorithmOptions
): I2DOptimizationResult {
    const expandedPieces = sort2DByAreaDesc(expand2DPieces(pieces));
    const stockManager = new Stock2DManager(stock);
    const unplaced = new UnplacedCollector2D();
    const activeSheets: IActiveSheet[] = [];

    for (const piece of expandedPieces) {
        let placed = false;

        // Try existing sheets
        for (const sheet of activeSheets) {
            if (tryPlaceGuillotine(sheet, piece, options)) {
                placed = true;
                break;
            }
        }

        // Try new sheet
        if (!placed) {
            const orientations = getOrientations(
                piece.width, piece.height, piece.canRotate, options.allowRotation
            );

            for (const orient of orientations) {
                const availableStock = stockManager.findAvailableStock(orient.width, orient.height);

                if (availableStock) {
                    const newSheet = createGuillotineSheet(
                        availableStock.id,
                        availableStock.width,
                        availableStock.height,
                        piece,
                        orient.rotated,
                        options.kerf
                    );
                    activeSheets.push(newSheet);
                    stockManager.consumeStock(availableStock.id);
                    placed = true;
                    break;
                }
            }
        }

        if (!placed) {
            unplaced.add(piece);
        }
    }

    return buildResult(activeSheets, unplaced.getAll(), expandedPieces.length, options);
}

export const GUILLOTINE_ALGORITHM = {
    name: '2D_GUILLOTINE',
    type: '2D' as const,
    description: 'Guillotine Cutting - Uses full-length cuts for splitting'
};
