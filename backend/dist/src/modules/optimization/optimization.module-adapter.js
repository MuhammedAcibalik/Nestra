"use strict";
/**
 * Optimization Module Adapter
 * Implements contract interface for external access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationModuleAdapter = void 0;
class OptimizationModuleAdapter {
    repository;
    moduleName = 'optimization';
    version = '1.0.0';
    constructor(repository) {
        this.repository = repository;
    }
    async getPlanById(id) {
        const plan = await this.repository.findPlanById(id);
        if (!plan)
            return null;
        return this.toContract(plan);
    }
    async updatePlanStatus(id, status) {
        await this.repository.updatePlanStatus(id, status);
    }
    async getApprovedPlans() {
        const plans = await this.repository.findAllPlans({ status: 'APPROVED' });
        return plans.map((plan) => this.toContract(plan));
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            await this.repository.findAllScenarios();
            return {
                module: this.moduleName,
                status: 'healthy',
                timestamp: new Date()
            };
        }
        catch (error) {
            console.debug('[OPTIMIZATION] Health check failed:', error);
            return {
                module: this.moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    }
    toContract(plan) {
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
exports.OptimizationModuleAdapter = OptimizationModuleAdapter;
//# sourceMappingURL=optimization.module-adapter.js.map