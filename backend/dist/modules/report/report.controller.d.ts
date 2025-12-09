/**
 * Report Controller
 * Following SRP - Only handles HTTP concerns
 */
import { Router, Request, Response, NextFunction } from 'express';
import { IReportService } from '../../core/interfaces';
export declare class ReportController {
    private readonly reportService;
    router: Router;
    constructor(reportService: IReportService);
    private initializeRoutes;
    private parseFilter;
    getWasteReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    getEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    getCustomerReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    getMachineReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare function createReportController(reportService: IReportService): ReportController;
//# sourceMappingURL=report.controller.d.ts.map