/**
 * 2D Unplaced Pieces Collector
 * Tracks pieces that couldn't be placed
 */
import { IExpanded2DPiece } from '../core/types';
import { I2DPieceInput } from '../core/piece-expander';
/**
 * Unplaced piece collector for 2D
 */
export declare class UnplacedCollector2D {
    private readonly unplaced;
    add(piece: IExpanded2DPiece): void;
    getAll(): I2DPieceInput[];
    getCount(): number;
    isEmpty(): boolean;
}
//# sourceMappingURL=unplaced-collector.d.ts.map