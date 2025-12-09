/**
 * Strategy Executor
 * Executes optimization algorithms via registry
 * Following DIP - Depends on abstractions
 */
import { IOptimizationParameters, I1DResult, I2DResult, I1DPiece, I1DStock, I2DPiece, I2DStock, IAlgorithmRegistry } from '../interfaces';
export interface IExecutionResult {
    success: boolean;
    result1D?: I1DResult;
    result2D?: I2DResult;
    error?: string;
    algorithm: string;
    executionTimeMs: number;
}
export declare class StrategyExecutor {
    private readonly registry;
    private initialized;
    constructor(registry?: IAlgorithmRegistry);
    /**
     * Initialize default algorithms
     */
    initialize(): void;
    /**
     * Execute 1D optimization
     */
    execute1D(pieces: I1DPiece[], stock: I1DStock[], params: IOptimizationParameters): IExecutionResult;
    /**
     * Execute 2D optimization
     */
    execute2D(pieces: I2DPiece[], stock: I2DStock[], params: IOptimizationParameters): IExecutionResult;
    /**
     * Get available algorithm names
     */
    getAvailable1DAlgorithms(): string[];
    getAvailable2DAlgorithms(): string[];
}
//# sourceMappingURL=strategy-executor.d.ts.map