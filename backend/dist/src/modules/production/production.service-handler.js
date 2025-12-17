"use strict";
/**
 * Production Service Handler
 * Exposes production module as internal service
 * Following ISP - only exposes needed operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionServiceHandler = void 0;
class ProductionServiceHandler {
    async handle(request) {
        const { method, path, data } = request;
        // Route: GET /production/:id
        if (method === 'GET' && path.match(/^\/production\/[\w-]+$/)) {
            const logId = path.split('/')[2];
            return this.getLogById(logId);
        }
        // Route: POST /production/start
        if (method === 'POST' && path === '/production/start') {
            return this.startProduction(data);
        }
        // Route: GET /production/active
        if (method === 'GET' && path === '/production/active') {
            return this.getActiveProductions();
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getLogById(logId) {
        try {
            console.log('[ProductionHandler] Get log:', logId);
            return { success: true, data: { id: logId, message: 'Production log endpoint' } };
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
    async startProduction(data) {
        try {
            console.log('[ProductionHandler] Start production:', data);
            return { success: true, data: { message: 'Production started' } };
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
    async getActiveProductions() {
        try {
            return { success: true, data: [] };
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
exports.ProductionServiceHandler = ProductionServiceHandler;
//# sourceMappingURL=production.service-handler.js.map