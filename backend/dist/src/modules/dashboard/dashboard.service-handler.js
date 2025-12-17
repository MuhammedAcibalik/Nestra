"use strict";
/**
 * Dashboard Service Handler
 * Exposes dashboard module as internal service
 * Following ISP - only exposes needed operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardServiceHandler = void 0;
class DashboardServiceHandler {
    async handle(request) {
        const { method, path } = request;
        // Route: GET /dashboard/summary
        if (method === 'GET' && path === '/dashboard/summary') {
            return this.getSummary();
        }
        // Route: GET /dashboard/stats
        if (method === 'GET' && path === '/dashboard/stats') {
            return this.getStats();
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getSummary() {
        try {
            // Placeholder - would call dashboard service
            return { success: true, data: { message: 'Dashboard summary endpoint' } };
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
    async getStats() {
        try {
            return { success: true, data: { message: 'Dashboard stats endpoint' } };
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
exports.DashboardServiceHandler = DashboardServiceHandler;
//# sourceMappingURL=dashboard.service-handler.js.map