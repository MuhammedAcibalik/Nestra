/**
 * Optimization Strategy Interface
 * Following Strategy Pattern + Open/Closed Principle
 * New optimization algorithms can be added without modifying existing code
 */
import { CuttingPiece1D, StockBar1D, Optimization1DResult, Optimization1DOptions } from '../../algorithms/1d/cutting1d';
import { CuttingPiece2D, StockSheet2D, Optimization2DResult, Optimization2DOptions } from '../../algorithms/2d/cutting2d';
export interface I1DOptimizationStrategy {
    name: string;
    optimize(pieces: CuttingPiece1D[], stock: StockBar1D[], options: Optimization1DOptions): Optimization1DResult;
}
export interface I2DOptimizationStrategy {
    name: string;
    optimize(pieces: CuttingPiece2D[], stock: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
}
export declare class OptimizationStrategyRegistry {
    private readonly strategies1D;
    private readonly strategies2D;
    register1DStrategy(strategy: I1DOptimizationStrategy): void;
    register2DStrategy(strategy: I2DOptimizationStrategy): void;
    get1DStrategy(name: string): I1DOptimizationStrategy | undefined;
    get2DStrategy(name: string): I2DOptimizationStrategy | undefined;
    getAll1DStrategies(): I1DOptimizationStrategy[];
    getAll2DStrategies(): I2DOptimizationStrategy[];
}
export type { CuttingPiece1D, StockBar1D, Optimization1DResult, Optimization1DOptions } from '../../algorithms/1d/cutting1d';
export type { CuttingPiece2D, StockSheet2D, Optimization2DResult, Optimization2DOptions } from '../../algorithms/2d/cutting2d';
//# sourceMappingURL=optimization.strategy.d.ts.map