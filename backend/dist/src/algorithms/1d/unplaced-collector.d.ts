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
export declare class UnplacedCollector1D {
    private readonly unplaced;
    /**
     * Add an unplaced piece
     */
    add(piece: IExpanded1DPiece): void;
    /**
     * Get all unplaced pieces with aggregated quantities
     */
    getAll(): I1DPieceInput[];
    /**
     * Get count of unplaced pieces
     */
    getCount(): number;
    /**
     * Check if there are any unplaced pieces
     */
    isEmpty(): boolean;
}
//# sourceMappingURL=unplaced-collector.d.ts.map