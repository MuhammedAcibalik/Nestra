"use strict";
/**
 * Optimization Worker - Piscina Format
 * Named exports for different optimization tasks
 * Following Microservice Pattern: Shared-Nothing, Message Passing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimize1D = optimize1D;
exports.optimize2D = optimize2D;
exports.default = handler;
const cutting1d_1 = require("../../algorithms/1d/cutting1d");
const cutting2d_1 = require("../../algorithms/2d/cutting2d");
// ==================== 1D OPTIMIZATION ====================
/**
 * Execute 1D cutting optimization
 * Named task for Piscina
 */
function optimize1D(payload) {
    const { pieces, stockBars, options } = payload;
    console.log(`[WORKER] 1D Optimization: ${pieces.length} pieces, ${stockBars.length} bars`);
    if (options.algorithm === 'BFD') {
        return (0, cutting1d_1.bestFitDecreasing)(pieces, stockBars, options);
    }
    return (0, cutting1d_1.firstFitDecreasing)(pieces, stockBars, options);
}
// ==================== 2D OPTIMIZATION ====================
/**
 * Execute 2D cutting optimization
 * Named task for Piscina
 */
function optimize2D(payload) {
    const { pieces, stockSheets, options } = payload;
    console.log(`[WORKER] 2D Optimization: ${pieces.length} pieces, ${stockSheets.length} sheets`);
    if (options.algorithm === 'GUILLOTINE') {
        return (0, cutting2d_1.guillotineCutting)(pieces, stockSheets, options);
    }
    return (0, cutting2d_1.bottomLeftFill)(pieces, stockSheets, options);
}
// ==================== DEFAULT EXPORT ====================
/**
 * Default handler for generic tasks
 * Dispatches to appropriate optimization based on type
 */
function handler(payload) {
    switch (payload.type) {
        case 'OPTIMIZATION_1D':
            return optimize1D(payload.data);
        case 'OPTIMIZATION_2D':
            return optimize2D(payload.data);
        default:
            throw new Error(`Unknown task type: ${payload.type}`);
    }
}
//# sourceMappingURL=optimization.worker.js.map