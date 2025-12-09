/**
 * 1D Optimization Dispatcher
 * Selects and executes appropriate 1D algorithm
 */
import { I1DPieceInput } from '../core/piece-expander';
import { I1DStockInput } from '../core/stock-manager';
import { I1DOptimizationResult } from './result-builder';
export type Algorithm1DType = 'FFD' | 'BFD' | 'BRANCH_BOUND';
export interface IOptimize1DOptions {
    algorithm: Algorithm1DType;
    kerf: number;
    minUsableWaste: number;
}
/**
 * Main 1D optimization entry point
 * Selects algorithm based on options and executes
 */
export declare function optimize1D(pieces: readonly I1DPieceInput[], stock: readonly I1DStockInput[], options: IOptimize1DOptions): I1DOptimizationResult;
export declare const ALGORITHMS_1D: {
    FFD: {
        name: string;
        type: "1D";
        description: string;
    };
    BFD: {
        name: string;
        type: "1D";
        description: string;
    };
};
/**
 * Get available 1D algorithms
 */
export declare function getAvailable1DAlgorithms(): string[];
//# sourceMappingURL=optimizer.d.ts.map