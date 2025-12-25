/**
 * Dashboard Service Handler
 * Exposes dashboard module as internal service
 * Following ISP - only exposes needed operations
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';

export class DashboardServiceHandler implements IServiceHandler {
    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /dashboard/summary
        if (method === 'GET' && path === '/dashboard/summary') {
            return this.getSummary() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /dashboard/stats
        if (method === 'GET' && path === '/dashboard/stats') {
            return this.getStats() as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getSummary(): Promise<IServiceResponse<unknown>> {
        try {
            // Placeholder - would call dashboard service
            return { success: true, data: { message: 'Dashboard summary endpoint' } };
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

    private async getStats(): Promise<IServiceResponse<unknown>> {
        try {
            return { success: true, data: { message: 'Dashboard stats endpoint' } };
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
