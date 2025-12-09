/**
 * 2D Optimization Dispatcher
 */
import { I2DPieceInput } from '../core/piece-expander';
import { I2DStockInput } from '../core/stock-manager';
import { I2DOptimizationResult } from './result-builder';
export type Algorithm2DType = 'BOTTOM_LEFT' | 'GUILLOTINE' | 'MAXRECTS';
export interface IOptimize2DOptions {
    algorithm: Algorithm2DType;
    kerf: number;
    allowRotation: boolean;
    guillotineOnly?: boolean;
}
export declare function optimize2D(pieces: readonly I2DPieceInput[], stock: readonly I2DStockInput[], options: IOptimize2DOptions): I2DOptimizationResult;
export declare const ALGORITHMS_2D: {
    BOTTOM_LEFT: {
        name: string;
        type: "2D";
        description: string;
    };
    GUILLOTINE: {
        name: string;
        type: "2D";
        description: string;
    };
};
export declare function getAvailable2DAlgorithms(): string[];
//# sourceMappingURL=optimizer.d.ts.map