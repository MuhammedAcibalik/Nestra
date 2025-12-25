/**
 * Production Service Handler
 * Exposes production module as internal service
 * Following ISP - only exposes needed operations
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';

export class ProductionServiceHandler implements IServiceHandler {
    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: GET /production/:id
        if (method === 'GET' && path.match(/^\/production\/[\w-]+$/)) {
            const logId = path.split('/')[2];
            return this.getLogById(logId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /production/start
        if (method === 'POST' && path === '/production/start') {
            return this.startProduction(data) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /production/active
        if (method === 'GET' && path === '/production/active') {
            return this.getActiveProductions() as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getLogById(logId: string): Promise<IServiceResponse<unknown>> {
        try {
            console.log('[ProductionHandler] Get log:', logId);
            return { success: true, data: { id: logId, message: 'Production log endpoint' } };
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

    private async startProduction(data: unknown): Promise<IServiceResponse<unknown>> {
        try {
            console.log('[ProductionHandler] Start production:', data);
            return { success: true, data: { message: 'Production started' } };
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

    private async getActiveProductions(): Promise<IServiceResponse<unknown[]>> {
        try {
            return { success: true, data: [] };
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
