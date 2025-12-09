/**
 * Strategy Executor
 * Executes optimization algorithms via registry
 * Following DIP - Depends on abstractions
 */

import {
    IOptimizationParameters,
    I1DResult,
    I2DResult,
    I1DPiece,
    I1DStock,
    I2DPiece,
    I2DStock,
    I1DAlgorithmOptions,
    I2DAlgorithmOptions,
    IAlgorithmRegistry
} from '../interfaces';
import { getAlgorithmRegistry, FFDStrategy, BFDStrategy, BottomLeftStrategy, GuillotineStrategy } from '../strategies';

export interface IExecutionResult {
    success: boolean;
    result1D?: I1DResult;
    result2D?: I2DResult;
    error?: string;
    algorithm: string;
    executionTimeMs: number;
}

export class StrategyExecutor {
    private readonly registry: IAlgorithmRegistry;
    private initialized = false;

    constructor(registry?: IAlgorithmRegistry) {
        this.registry = registry ?? getAlgorithmRegistry();
    }

    /**
     * Initialize default algorithms
     */
    initialize(): void {
        if (this.initialized) return;

        // Register 1D algorithms
        this.registry.register1D(new FFDStrategy());
        this.registry.register1D(new BFDStrategy());

        // Register 2D algorithms
        this.registry.register2D(new BottomLeftStrategy());
        this.registry.register2D(new GuillotineStrategy());

        this.initialized = true;
    }

    /**
     * Execute 1D optimization
     */
    execute1D(
        pieces: I1DPiece[],
        stock: I1DStock[],
        params: IOptimizationParameters
    ): IExecutionResult {
        this.initialize();

        const startTime = Date.now();
        const algorithmName = params.algorithm ?? '1D_FFD';
        const algorithm = this.registry.get1D(algorithmName);

        if (!algorithm) {
            return {
                success: false,
                error: `Algorithm not found: ${algorithmName}`,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }

        try {
            const options: I1DAlgorithmOptions = {
                kerf: params.kerf ?? 3,
                minUsableWaste: params.minUsableWaste ?? 50,
                algorithm: algorithmName as '1D_FFD' | '1D_BFD'
            };

            const result = algorithm.execute(pieces, stock, options);

            return {
                success: result.success,
                result1D: result,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }
    }

    /**
     * Execute 2D optimization
     */
    execute2D(
        pieces: I2DPiece[],
        stock: I2DStock[],
        params: IOptimizationParameters
    ): IExecutionResult {
        this.initialize();

        const startTime = Date.now();
        const algorithmName = params.algorithm ?? '2D_BOTTOM_LEFT';
        const algorithm = this.registry.get2D(algorithmName);

        if (!algorithm) {
            return {
                success: false,
                error: `Algorithm not found: ${algorithmName}`,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }

        try {
            const options: I2DAlgorithmOptions = {
                kerf: params.kerf ?? 3,
                allowRotation: params.allowRotation ?? true,
                guillotineOnly: algorithmName === '2D_GUILLOTINE',
                algorithm: algorithmName as '2D_BOTTOM_LEFT' | '2D_GUILLOTINE'
            };

            const result = algorithm.execute(pieces, stock, options);

            return {
                success: result.success,
                result2D: result,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }
    }

    /**
     * Get available algorithm names
     */
    getAvailable1DAlgorithms(): string[] {
        this.initialize();
        return this.registry.getAll1D().map(a => a.name);
    }

    getAvailable2DAlgorithms(): string[] {
        this.initialize();
        return this.registry.getAll2D().map(a => a.name);
    }
}
