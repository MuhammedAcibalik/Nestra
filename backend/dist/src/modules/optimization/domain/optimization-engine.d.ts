/**
 * Optimization Engine (Refactored)
 * Core orchestrator for optimization process
 * Following SRP - Only orchestration
 */
import { PrismaClient } from '@prisma/client';
import { IOptimizationInput, IOptimizationOutput, IOptimizationEngine } from '../interfaces';
export declare class OptimizationEngine implements IOptimizationEngine {
    private readonly dataLoader;
    private readonly executor;
    constructor(prisma: PrismaClient);
    execute(input: IOptimizationInput): Promise<IOptimizationOutput>;
    private is1DJob;
    private failureResult;
}
//# sourceMappingURL=optimization-engine.d.ts.map