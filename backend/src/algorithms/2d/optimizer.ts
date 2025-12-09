/**
 * 2D Optimization Dispatcher
 */

import { I2DPieceInput } from '../core/piece-expander';
import { I2DStockInput } from '../core/stock-manager';
import { I2DOptimizationResult } from './result-builder';
import { bottomLeftFill, BOTTOM_LEFT_ALGORITHM } from './bottom-left-algorithm';
import { guillotineCutting, GUILLOTINE_ALGORITHM } from './guillotine-algorithm';

export type Algorithm2DType = 'BOTTOM_LEFT' | 'GUILLOTINE' | 'MAXRECTS';

export interface IOptimize2DOptions {
    algorithm: Algorithm2DType;
    kerf: number;
    allowRotation: boolean;
    guillotineOnly?: boolean;
}

export function optimize2D(
    pieces: readonly I2DPieceInput[],
    stock: readonly I2DStockInput[],
    options: IOptimize2DOptions
): I2DOptimizationResult {
    const algorithmOptions = {
        kerf: options.kerf,
        allowRotation: options.allowRotation
    };

    switch (options.algorithm) {
        case 'BOTTOM_LEFT':
            return bottomLeftFill(pieces, stock, algorithmOptions);

        case 'GUILLOTINE':
            return guillotineCutting(pieces, stock, algorithmOptions);

        case 'MAXRECTS':
            return guillotineCutting(pieces, stock, algorithmOptions);

        default:
            return bottomLeftFill(pieces, stock, algorithmOptions);
    }
}

export const ALGORITHMS_2D = {
    BOTTOM_LEFT: BOTTOM_LEFT_ALGORITHM,
    GUILLOTINE: GUILLOTINE_ALGORITHM
};

export function getAvailable2DAlgorithms(): string[] {
    return Object.keys(ALGORITHMS_2D);
}
