/**
 * Optimization Service Handler
 * Exposes optimization module as internal service
 * Following ISP - only exposes needed operations
 */

import { IServiceHandler, IServiceRequest, IServiceResponse, IPlanSummary, IPlanStockItem } from '../../core/services';
import { IOptimizationRepository } from './optimization.repository';

export class OptimizationServiceHandler implements IServiceHandler {
    constructor(private readonly repository: IOptimizationRepository) {}

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: GET /plans/:id
        if (method === 'GET' && path.match(/^\/plans\/[\w-]+$/)) {
            const planId = path.split('/')[2];
            return this.getPlanById(planId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /plans/:id/stock-items
        if (method === 'GET' && path.match(/^\/plans\/[\w-]+\/stock-items$/)) {
            const planId = path.split('/')[2];
            return this.getPlanStockItems(planId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: PUT /plans/:id/status
        if (method === 'PUT' && path.match(/^\/plans\/[\w-]+\/status$/)) {
            const planId = path.split('/')[2];
            const { status } = data as { status: string };
            return this.updatePlanStatus(planId, status) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /plans/approved (for Production module)
        if (method === 'POST' && path === '/plans/approved') {
            const filter = data as { scenarioId?: string; fromDate?: Date; toDate?: Date } | undefined;
            return this.getApprovedPlans(filter) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getPlanById(planId: string): Promise<IServiceResponse<IPlanSummary>> {
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
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getPlanStockItems(planId: string): Promise<IServiceResponse<IPlanStockItem[]>> {
        try {
            const items = await this.repository.getPlanStockItems(planId);

            return {
                success: true,
                data: items.map((item) => ({
                    stockItemId: item.stockItemId,
                    sequence: item.sequence,
                    waste: item.waste
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async updatePlanStatus(planId: string, status: string): Promise<IServiceResponse<void>> {
        try {
            await this.repository.updatePlanStatus(planId, status);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getApprovedPlans(filter?: {
        scenarioId?: string;
        fromDate?: Date;
        toDate?: Date;
    }): Promise<IServiceResponse<IPlanSummary[]>> {
        try {
            const plans = await this.repository.findAllPlans({ status: 'APPROVED' });

            // Apply optional filters
            let filtered = plans;
            if (filter?.scenarioId) {
                filtered = filtered.filter((p) => p.scenarioId === filter.scenarioId);
            }
            // Note: Date filtering would require comparing plan dates
            // For now, we return all approved plans

            return {
                success: true,
                data: filtered.map((plan) => ({
                    id: plan.id,
                    planNumber: plan.planNumber,
                    scenarioId: plan.scenarioId,
                    status: plan.status,
                    totalWaste: plan.totalWaste,
                    wastePercentage: plan.wastePercentage,
                    stockUsedCount: plan.stockUsedCount
                }))
            };
        } catch (error) {
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
