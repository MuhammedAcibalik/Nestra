/**
 * 1D Optimization Dispatcher
 * Selects and executes appropriate 1D algorithm
 */

import { I1DPieceInput } from '../core/piece-expander';
import { I1DStockInput } from '../core/stock-manager';
import { I1DOptimizationResult } from './result-builder';
import { firstFitDecreasing, FFD_ALGORITHM } from './ffd-algorithm';
import { bestFitDecreasing, BFD_ALGORITHM } from './bfd-algorithm';

// ==================== OPTIONS ====================

export type Algorithm1DType = 'FFD' | 'BFD' | 'BRANCH_BOUND';

export interface IOptimize1DOptions {
    algorithm: Algorithm1DType;
    kerf: number;
    minUsableWaste: number;
}

// ==================== DISPATCHER ====================

/**
 * Main 1D optimization entry point
 * Selects algorithm based on options and executes
 */
export function optimize1D(
    pieces: readonly I1DPieceInput[],
    stock: readonly I1DStockInput[],
    options: IOptimize1DOptions
): I1DOptimizationResult {
    const algorithmOptions = {
        kerf: options.kerf,
        minUsableWaste: options.minUsableWaste
    };

    switch (options.algorithm) {
        case 'FFD':
            return firstFitDecreasing(pieces, stock, algorithmOptions);

        case 'BFD':
            return bestFitDecreasing(pieces, stock, algorithmOptions);

        case 'BRANCH_BOUND':
            // Branch and Bound is complex - fallback to BFD for now
            // Can be implemented later for small datasets
            return bestFitDecreasing(pieces, stock, algorithmOptions);

        default:
            return firstFitDecreasing(pieces, stock, algorithmOptions);
    }
}

// ==================== ALGORITHM REGISTRY ====================

export const ALGORITHMS_1D = {
    FFD: FFD_ALGORITHM,
    BFD: BFD_ALGORITHM
};

/**
 * Get available 1D algorithms
 */
export function getAvailable1DAlgorithms(): string[] {
    return Object.keys(ALGORITHMS_1D);
}
