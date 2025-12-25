/**
 * Optimization Strategy Interface
 * Following Strategy Pattern + Open/Closed Principle
 * New optimization algorithms can be added without modifying existing code
 */

import { CuttingPiece1D, StockBar1D, Optimization1DResult, Optimization1DOptions } from '../../algorithms/1d/cutting1d';
import {
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DResult,
    Optimization2DOptions
} from '../../algorithms/2d/cutting2d';

// Strategy interfaces for extensibility
export interface I1DOptimizationStrategy {
    name: string;
    optimize(pieces: CuttingPiece1D[], stock: StockBar1D[], options: Optimization1DOptions): Optimization1DResult;
}

export interface I2DOptimizationStrategy {
    name: string;
    optimize(pieces: CuttingPiece2D[], stock: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult;
}

// Strategy Registry - implements OCP
export class OptimizationStrategyRegistry {
    private readonly strategies1D: Map<string, I1DOptimizationStrategy> = new Map();
    private readonly strategies2D: Map<string, I2DOptimizationStrategy> = new Map();

    register1DStrategy(strategy: I1DOptimizationStrategy): void {
        this.strategies1D.set(strategy.name, strategy);
    }

    register2DStrategy(strategy: I2DOptimizationStrategy): void {
        this.strategies2D.set(strategy.name, strategy);
    }

    get1DStrategy(name: string): I1DOptimizationStrategy | undefined {
        return this.strategies1D.get(name);
    }

    get2DStrategy(name: string): I2DOptimizationStrategy | undefined {
        return this.strategies2D.get(name);
    }

    getAll1DStrategies(): I1DOptimizationStrategy[] {
        return Array.from(this.strategies1D.values());
    }

    getAll2DStrategies(): I2DOptimizationStrategy[] {
        return Array.from(this.strategies2D.values());
    }
}

// Re-export algorithm types
// Re-export algorithm types
export type {
    CuttingPiece1D,
    StockBar1D,
    Optimization1DResult,
    Optimization1DOptions
} from '../../algorithms/1d/cutting1d';

export type {
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DResult,
    Optimization2DOptions
} from '../../algorithms/2d/cutting2d';
