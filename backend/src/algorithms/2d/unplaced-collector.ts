/**
 * 2D Unplaced Pieces Collector
 * Tracks pieces that couldn't be placed
 */

import { IExpanded2DPiece } from '../core/types';
import { I2DPieceInput } from '../core/piece-expander';

/**
 * Unplaced piece collector for 2D
 */
export class UnplacedCollector2D {
    private readonly unplaced: Map<string, { piece: I2DPieceInput; count: number }> = new Map();

    add(piece: IExpanded2DPiece): void {
        const existing = this.unplaced.get(piece.originalId);

        if (existing) {
            existing.count++;
        } else {
            this.unplaced.set(piece.originalId, {
                piece: {
                    id: piece.originalId,
                    width: piece.width,
                    height: piece.height,
                    quantity: 1,
                    orderItemId: piece.orderItemId,
                    canRotate: piece.canRotate
                },
                count: 1
            });
        }
    }

    getAll(): I2DPieceInput[] {
        return Array.from(this.unplaced.values()).map(entry => ({
            ...entry.piece,
            quantity: entry.count
        }));
    }

    getCount(): number {
        return Array.from(this.unplaced.values())
            .reduce((sum, entry) => sum + entry.count, 0);
    }

    isEmpty(): boolean {
        return this.unplaced.size === 0;
    }
}
