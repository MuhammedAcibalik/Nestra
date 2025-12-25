/**
 * Algorithm Registry
 * DI-ready registry for optimization algorithms
 * Following OCP - New algorithms can be added without modifying existing code
 */

import { I1DAlgorithm, I2DAlgorithm, IAlgorithmRegistry } from '../interfaces';

export class AlgorithmRegistry implements IAlgorithmRegistry {
    private readonly algorithms1D: Map<string, I1DAlgorithm> = new Map();
    private readonly algorithms2D: Map<string, I2DAlgorithm> = new Map();

    register1D(algorithm: I1DAlgorithm): void {
        this.algorithms1D.set(algorithm.name, algorithm);
    }

    register2D(algorithm: I2DAlgorithm): void {
        this.algorithms2D.set(algorithm.name, algorithm);
    }

    get1D(name: string): I1DAlgorithm | undefined {
        return this.algorithms1D.get(name);
    }

    get2D(name: string): I2DAlgorithm | undefined {
        return this.algorithms2D.get(name);
    }

    getAll1D(): I1DAlgorithm[] {
        return Array.from(this.algorithms1D.values());
    }

    getAll2D(): I2DAlgorithm[] {
        return Array.from(this.algorithms2D.values());
    }

    has1D(name: string): boolean {
        return this.algorithms1D.has(name);
    }

    has2D(name: string): boolean {
        return this.algorithms2D.has(name);
    }

    get1DNames(): string[] {
        return Array.from(this.algorithms1D.keys());
    }

    get2DNames(): string[] {
        return Array.from(this.algorithms2D.keys());
    }
}

// Singleton instance with lazy initialization
let registryInstance: AlgorithmRegistry | null = null;

export function getAlgorithmRegistry(): AlgorithmRegistry {
    registryInstance ??= new AlgorithmRegistry();
    return registryInstance;
}

export function resetAlgorithmRegistry(): void {
    registryInstance = null;
}
