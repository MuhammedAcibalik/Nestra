"use strict";
/**
 * Optimization Strategy Interface
 * Following Strategy Pattern + Open/Closed Principle
 * New optimization algorithms can be added without modifying existing code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationStrategyRegistry = void 0;
// Strategy Registry - implements OCP
class OptimizationStrategyRegistry {
    strategies1D = new Map();
    strategies2D = new Map();
    register1DStrategy(strategy) {
        this.strategies1D.set(strategy.name, strategy);
    }
    register2DStrategy(strategy) {
        this.strategies2D.set(strategy.name, strategy);
    }
    get1DStrategy(name) {
        return this.strategies1D.get(name);
    }
    get2DStrategy(name) {
        return this.strategies2D.get(name);
    }
    getAll1DStrategies() {
        return Array.from(this.strategies1D.values());
    }
    getAll2DStrategies() {
        return Array.from(this.strategies2D.values());
    }
}
exports.OptimizationStrategyRegistry = OptimizationStrategyRegistry;
//# sourceMappingURL=optimization.strategy.js.map