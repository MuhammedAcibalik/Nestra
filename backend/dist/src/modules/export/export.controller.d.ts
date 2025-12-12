/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 * Refactored to follow microservice architecture - uses repository injection
 */
import { Router } from 'express';
import { IExportRepository } from './export.repository';
export interface IExportController {
    readonly router: Router;
}
export declare class ExportController implements IExportController {
    private readonly repository;
    readonly router: Router;
    constructor(repository: IExportRepository);
    private initializeRoutes;
    private exportPlanToPdf;
    private exportPlanToExcel;
    private exportMultiplePlansToExcel;
    /**
     * Transform repository data to export format
     */
    private getPlanExportData;
    /**
     * Transform stock items to layout export format
     */
    private transformLayouts;
}
//# sourceMappingURL=export.controller.d.ts.map