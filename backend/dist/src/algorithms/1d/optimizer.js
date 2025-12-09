"use strict";
/**
 * 1D Optimization Dispatcher
 * Selects and executes appropriate 1D algorithm
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGORITHMS_1D = void 0;
exports.optimize1D = optimize1D;
exports.getAvailable1DAlgorithms = getAvailable1DAlgorithms;
const ffd_algorithm_1 = require("./ffd-algorithm");
const bfd_algorithm_1 = require("./bfd-algorithm");
// ==================== DISPATCHER ====================
/**
 * Main 1D optimization entry point
 * Selects algorithm based on options and executes
 */
function optimize1D(pieces, stock, options) {
    const algorithmOptions = {
        kerf: options.kerf,
        minUsableWaste: options.minUsableWaste
    };
    switch (options.algorithm) {
        case 'FFD':
            return (0, ffd_algorithm_1.firstFitDecreasing)(pieces, stock, algorithmOptions);
        case 'BFD':
            return (0, bfd_algorithm_1.bestFitDecreasing)(pieces, stock, algorithmOptions);
        case 'BRANCH_BOUND':
            // Branch and Bound is complex - fallback to BFD for now
            // Can be implemented later for small datasets
            return (0, bfd_algorithm_1.bestFitDecreasing)(pieces, stock, algorithmOptions);
        default:
            return (0, ffd_algorithm_1.firstFitDecreasing)(pieces, stock, algorithmOptions);
    }
}
// ==================== ALGORITHM REGISTRY ====================
exports.ALGORITHMS_1D = {
    FFD: ffd_algorithm_1.FFD_ALGORITHM,
    BFD: bfd_algorithm_1.BFD_ALGORITHM
};
/**
 * Get available 1D algorithms
 */
function getAvailable1DAlgorithms() {
    return Object.keys(exports.ALGORITHMS_1D);
}
//# sourceMappingURL=optimizer.js.map