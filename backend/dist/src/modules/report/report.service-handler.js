"use strict";
/**
 * Report Service Handler
 * Exposes report module as internal service
 * Following ISP - only exposes needed operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportServiceHandler = void 0;
class ReportServiceHandler {
    async handle(request) {
        const { method, path, data } = request;
        // Route: POST /reports/waste
        if (method === 'POST' && path === '/reports/waste') {
            return this.getWasteReport(data);
        }
        // Route: POST /reports/efficiency
        if (method === 'POST' && path === '/reports/efficiency') {
            return this.getEfficiencyReport(data);
        }
        // Route: POST /reports/cost
        if (method === 'POST' && path === '/reports/cost') {
            return this.getCostReport(data);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getWasteReport(data) {
        try {
            console.log('[ReportHandler] Waste report:', data);
            return { success: true, data: { report: 'waste', message: 'Waste report endpoint' } };
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
    async getEfficiencyReport(data) {
        try {
            console.log('[ReportHandler] Efficiency report:', data);
            return { success: true, data: { report: 'efficiency', message: 'Efficiency report endpoint' } };
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
    async getCostReport(data) {
        try {
            console.log('[ReportHandler] Cost report:', data);
            return { success: true, data: { report: 'cost', message: 'Cost report endpoint' } };
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
exports.ReportServiceHandler = ReportServiceHandler;
//# sourceMappingURL=report.service-handler.js.map