/**
 * Optimization Module Adapter
 * Implements contract interface for external access
 */
import { IOptimizationContract, IPlanContract, IModuleHealth } from '../../core/contracts';
import { IOptimizationRepository } from './optimization.repository';
export declare class OptimizationModuleAdapter implements IOptimizationContract {
    private readonly repository;
    readonly moduleName = "optimization";
    readonly version = "1.0.0";
    constructor(repository: IOptimizationRepository);
    getPlanById(id: string): Promise<IPlanContract | null>;
    updatePlanStatus(id: string, status: string): Promise<void>;
    getApprovedPlans(): Promise<IPlanContract[]>;
    /**
     * Health check
     */
    healthCheck(): Promise<IModuleHealth>;
    private toContract;
}
//# sourceMappingURL=optimization.module-adapter.d.ts.map