"use strict";
/**
 * Algorithm Registry
 * DI-ready registry for optimization algorithms
 * Following OCP - New algorithms can be added without modifying existing code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgorithmRegistry = void 0;
exports.getAlgorithmRegistry = getAlgorithmRegistry;
exports.resetAlgorithmRegistry = resetAlgorithmRegistry;
class AlgorithmRegistry {
    algorithms1D = new Map();
    algorithms2D = new Map();
    register1D(algorithm) {
        this.algorithms1D.set(algorithm.name, algorithm);
    }
    register2D(algorithm) {
        this.algorithms2D.set(algorithm.name, algorithm);
    }
    get1D(name) {
        return this.algorithms1D.get(name);
    }
    get2D(name) {
        return this.algorithms2D.get(name);
    }
    getAll1D() {
        return Array.from(this.algorithms1D.values());
    }
    getAll2D() {
        return Array.from(this.algorithms2D.values());
    }
    has1D(name) {
        return this.algorithms1D.has(name);
    }
    has2D(name) {
        return this.algorithms2D.has(name);
    }
    get1DNames() {
        return Array.from(this.algorithms1D.keys());
    }
    get2DNames() {
        return Array.from(this.algorithms2D.keys());
    }
}
exports.AlgorithmRegistry = AlgorithmRegistry;
// Singleton instance with lazy initialization
let registryInstance = null;
function getAlgorithmRegistry() {
    registryInstance ??= new AlgorithmRegistry();
    return registryInstance;
}
function resetAlgorithmRegistry() {
    registryInstance = null;
}
//# sourceMappingURL=algorithm-registry.js.map