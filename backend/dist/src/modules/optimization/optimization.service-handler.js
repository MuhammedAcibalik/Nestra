"use strict";
/**
 * Optimization Service Handler
 * Exposes optimization module as internal service
 * Following ISP - only exposes needed operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationServiceHandler = void 0;
class OptimizationServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path, data } = request;
        // Route: GET /plans/:id
        if (method === 'GET' && path.match(/^\/plans\/[\w-]+$/)) {
            const planId = path.split('/')[2];
            return this.getPlanById(planId);
        }
        // Route: GET /plans/:id/stock-items
        if (method === 'GET' && path.match(/^\/plans\/[\w-]+\/stock-items$/)) {
            const planId = path.split('/')[2];
            return this.getPlanStockItems(planId);
        }
        // Route: PUT /plans/:id/status
        if (method === 'PUT' && path.match(/^\/plans\/[\w-]+\/status$/)) {
            const planId = path.split('/')[2];
            const { status } = data;
            return this.updatePlanStatus(planId, status);
        }
        // Route: POST /plans/approved (for Production module)
        if (method === 'POST' && path === '/plans/approved') {
            const filter = data;
            return this.getApprovedPlans(filter);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getPlanById(planId) {
        try {
            const plan = await this.repository.findPlanById(planId);
            if (!plan) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Plan not found' }
                };
            }
            return {
                success: true,
                data: {
                    id: plan.id,
                    planNumber: plan.planNumber,
                    scenarioId: plan.scenarioId,
                    status: plan.status,
                    totalWaste: plan.totalWaste,
                    wastePercentage: plan.wastePercentage,
                    stockUsedCount: plan.stockUsedCount
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getPlanStockItems(planId) {
        try {
            const items = await this.repository.getPlanStockItems(planId);
            return {
                success: true,
                data: items.map(item => ({
                    stockItemId: item.stockItemId,
                    sequence: item.sequence,
                    waste: item.waste
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async updatePlanStatus(planId, status) {
        try {
            await this.repository.updatePlanStatus(planId, status);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getApprovedPlans(filter) {
        try {
            const plans = await this.repository.findAllPlans({ status: 'APPROVED' });
            // Apply optional filters
            let filtered = plans;
            if (filter?.scenarioId) {
                filtered = filtered.filter(p => p.scenarioId === filter.scenarioId);
            }
            // Note: Date filtering would require comparing plan dates
            // For now, we return all approved plans
            return {
                success: true,
                data: filtered.map(plan => ({
                    id: plan.id,
                    planNumber: plan.planNumber,
                    scenarioId: plan.scenarioId,
                    status: plan.status,
                    totalWaste: plan.totalWaste,
                    wastePercentage: plan.wastePercentage,
                    stockUsedCount: plan.stockUsedCount
                }))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}
exports.OptimizationServiceHandler = OptimizationServiceHandler;
//# sourceMappingURL=optimization.service-handler.js.map