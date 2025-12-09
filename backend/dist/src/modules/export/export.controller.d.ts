/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 */
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
export declare class ExportController {
    private readonly prisma;
    readonly router: Router;
    constructor(prisma: PrismaClient);
    private initializeRoutes;
    private exportPlanToPdf;
    private exportPlanToExcel;
    private exportMultiplePlansToExcel;
    private getPlanExportData;
}
//# sourceMappingURL=export.controller.d.ts.map