/**
 * Optimization Module Adapter
 * Implements contract interface for external access
 */

import { IOptimizationContract, IPlanContract, IModuleHealth } from '../../core/contracts';
import { IOptimizationRepository } from './optimization.repository';

export class OptimizationModuleAdapter implements IOptimizationContract {
    readonly moduleName = 'optimization';
    readonly version = '1.0.0';

    constructor(private readonly repository: IOptimizationRepository) {}

    async getPlanById(id: string): Promise<IPlanContract | null> {
        const plan = await this.repository.findPlanById(id);
        if (!plan) return null;

        return this.toContract(plan);
    }

    async updatePlanStatus(id: string, status: string): Promise<void> {
        await this.repository.updatePlanStatus(id, status);
    }

    async getApprovedPlans(): Promise<IPlanContract[]> {
        const plans = await this.repository.findAllPlans({ status: 'APPROVED' });
        return plans.map((plan) => this.toContract(plan));
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<IModuleHealth> {
        try {
            await this.repository.findAllScenarios();
            return {
                module: this.moduleName,
                status: 'healthy',
                timestamp: new Date()
            };
        } catch (error) {
            console.debug('[OPTIMIZATION] Health check failed:', error);
            return {
                module: this.moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    }

    private toContract(plan: {
        id: string;
        planNumber: string;
        scenarioId: string;
        status: string;
        totalWaste: number;
        wastePercentage: number;
        stockUsedCount: number;
    }): IPlanContract {
        return {
            id: plan.id,
            planNumber: plan.planNumber,
            scenarioId: plan.scenarioId,
            status: plan.status,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount
        };
    }
}
