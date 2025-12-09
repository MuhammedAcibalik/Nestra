/**
 * Algorithm Registry
 * DI-ready registry for optimization algorithms
 * Following OCP - New algorithms can be added without modifying existing code
 */
import { I1DAlgorithm, I2DAlgorithm, IAlgorithmRegistry } from '../interfaces';
export declare class AlgorithmRegistry implements IAlgorithmRegistry {
    private readonly algorithms1D;
    private readonly algorithms2D;
    register1D(algorithm: I1DAlgorithm): void;
    register2D(algorithm: I2DAlgorithm): void;
    get1D(name: string): I1DAlgorithm | undefined;
    get2D(name: string): I2DAlgorithm | undefined;
    getAll1D(): I1DAlgorithm[];
    getAll2D(): I2DAlgorithm[];
    has1D(name: string): boolean;
    has2D(name: string): boolean;
    get1DNames(): string[];
    get2DNames(): string[];
}
export declare function getAlgorithmRegistry(): AlgorithmRegistry;
export declare function resetAlgorithmRegistry(): void;
//# sourceMappingURL=algorithm-registry.d.ts.map