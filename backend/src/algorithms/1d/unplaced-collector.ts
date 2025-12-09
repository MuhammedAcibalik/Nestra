/**
 * 1D Unplaced Pieces Collector
 * Tracks pieces that couldn't be placed
 * Single Responsibility: Only handles unplaced piece aggregation
 */

import { IExpanded1DPiece } from '../core/types';
import { I1DPieceInput } from '../core/piece-expander';

/**
 * Unplaced piece collector
 * Groups expanded pieces back by originalId with quantity
 */
export class UnplacedCollector1D {
    private readonly unplaced: Map<string, { piece: I1DPieceInput; count: number }> = new Map();

    /**
     * Add an unplaced piece
     */
    add(piece: IExpanded1DPiece): void {
        const existing = this.unplaced.get(piece.originalId);

        if (existing) {
            existing.count++;
        } else {
            this.unplaced.set(piece.originalId, {
                piece: {
                    id: piece.originalId,
                    length: piece.length,
                    quantity: 1,
                    orderItemId: piece.orderItemId
                },
                count: 1
            });
        }
    }

    /**
     * Get all unplaced pieces with aggregated quantities
     */
    getAll(): I1DPieceInput[] {
        return Array.from(this.unplaced.values()).map(entry => ({
            ...entry.piece,
            quantity: entry.count
        }));
    }

    /**
     * Get count of unplaced pieces
     */
    getCount(): number {
        return Array.from(this.unplaced.values())
            .reduce((sum, entry) => sum + entry.count, 0);
    }

    /**
     * Check if there are any unplaced pieces
     */
    isEmpty(): boolean {
        return this.unplaced.size === 0;
    }
}
