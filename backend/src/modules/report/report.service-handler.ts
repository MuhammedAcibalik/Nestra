/**
 * Report Service Handler
 * Exposes report module as internal service
 * Following ISP - only exposes needed operations
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';

export class ReportServiceHandler implements IServiceHandler {
    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: POST /reports/waste
        if (method === 'POST' && path === '/reports/waste') {
            return this.getWasteReport(data) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /reports/efficiency
        if (method === 'POST' && path === '/reports/efficiency') {
            return this.getEfficiencyReport(data) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /reports/cost
        if (method === 'POST' && path === '/reports/cost') {
            return this.getCostReport(data) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getWasteReport(data: unknown): Promise<IServiceResponse<unknown>> {
        try {
            console.log('[ReportHandler] Waste report:', data);
            return { success: true, data: { report: 'waste', message: 'Waste report endpoint' } };
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

    private async getEfficiencyReport(data: unknown): Promise<IServiceResponse<unknown>> {
        try {
            console.log('[ReportHandler] Efficiency report:', data);
            return { success: true, data: { report: 'efficiency', message: 'Efficiency report endpoint' } };
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

    private async getCostReport(data: unknown): Promise<IServiceResponse<unknown>> {
        try {
            console.log('[ReportHandler] Cost report:', data);
            return { success: true, data: { report: 'cost', message: 'Cost report endpoint' } };
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
