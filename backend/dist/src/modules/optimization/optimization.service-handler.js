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
}
exports.OptimizationServiceHandler = OptimizationServiceHandler;
//# sourceMappingURL=optimization.service-handler.js.map