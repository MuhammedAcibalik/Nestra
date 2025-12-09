"use strict";
/**
 * 2D Optimization Dispatcher
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGORITHMS_2D = void 0;
exports.optimize2D = optimize2D;
exports.getAvailable2DAlgorithms = getAvailable2DAlgorithms;
const bottom_left_algorithm_1 = require("./bottom-left-algorithm");
const guillotine_algorithm_1 = require("./guillotine-algorithm");
function optimize2D(pieces, stock, options) {
    const algorithmOptions = {
        kerf: options.kerf,
        allowRotation: options.allowRotation
    };
    switch (options.algorithm) {
        case 'BOTTOM_LEFT':
            return (0, bottom_left_algorithm_1.bottomLeftFill)(pieces, stock, algorithmOptions);
        case 'GUILLOTINE':
            return (0, guillotine_algorithm_1.guillotineCutting)(pieces, stock, algorithmOptions);
        case 'MAXRECTS':
            return (0, guillotine_algorithm_1.guillotineCutting)(pieces, stock, algorithmOptions);
        default:
            return (0, bottom_left_algorithm_1.bottomLeftFill)(pieces, stock, algorithmOptions);
    }
}
exports.ALGORITHMS_2D = {
    BOTTOM_LEFT: bottom_left_algorithm_1.BOTTOM_LEFT_ALGORITHM,
    GUILLOTINE: guillotine_algorithm_1.GUILLOTINE_ALGORITHM
};
function getAvailable2DAlgorithms() {
    return Object.keys(exports.ALGORITHMS_2D);
}
//# sourceMappingURL=optimizer.js.map