"use strict";
/**
 * Strategy Executor
 * Executes optimization algorithms via registry
 * Following DIP - Depends on abstractions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrategyExecutor = void 0;
const strategies_1 = require("../strategies");
class StrategyExecutor {
    registry;
    initialized = false;
    constructor(registry) {
        this.registry = registry ?? (0, strategies_1.getAlgorithmRegistry)();
    }
    /**
     * Initialize default algorithms
     */
    initialize() {
        if (this.initialized)
            return;
        // Register 1D algorithms
        this.registry.register1D(new strategies_1.FFDStrategy());
        this.registry.register1D(new strategies_1.BFDStrategy());
        // Register 2D algorithms
        this.registry.register2D(new strategies_1.BottomLeftStrategy());
        this.registry.register2D(new strategies_1.GuillotineStrategy());
        this.initialized = true;
    }
    /**
     * Execute 1D optimization
     */
    execute1D(pieces, stock, params) {
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
            const options = {
                kerf: params.kerf ?? 3,
                minUsableWaste: params.minUsableWaste ?? 50,
                algorithm: algorithmName
            };
            const result = algorithm.execute(pieces, stock, options);
            return {
                success: result.success,
                result1D: result,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
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
    execute2D(pieces, stock, params) {
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
            const options = {
                kerf: params.kerf ?? 3,
                allowRotation: params.allowRotation ?? true,
                guillotineOnly: algorithmName === '2D_GUILLOTINE',
                algorithm: algorithmName
            };
            const result = algorithm.execute(pieces, stock, options);
            return {
                success: result.success,
                result2D: result,
                algorithm: algorithmName,
                executionTimeMs: Date.now() - startTime
            };
        }
        catch (error) {
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
    getAvailable1DAlgorithms() {
        this.initialize();
        return this.registry.getAll1D().map(a => a.name);
    }
    getAvailable2DAlgorithms() {
        this.initialize();
        return this.registry.getAll2D().map(a => a.name);
    }
}
exports.StrategyExecutor = StrategyExecutor;
//# sourceMappingURL=strategy-executor.js.map