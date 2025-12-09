/**
 * Report Controller
 * Following SRP - Only handles HTTP concerns
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IReportService, IReportFilter } from '../../core/interfaces';

export class ReportController {
    public router: Router;

    constructor(private readonly reportService: IReportService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/waste', this.getWasteReport.bind(this));
        this.router.get('/efficiency', this.getEfficiencyReport.bind(this));
        this.router.get('/customers', this.getCustomerReport.bind(this));
        this.router.get('/machines', this.getMachineReport.bind(this));
    }

    private parseFilter(req: Request): IReportFilter {
        return {
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            materialTypeId: req.query.materialTypeId as string,
            customerId: req.query.customerId as string,
            machineId: req.query.machineId as string,
            groupBy: (req.query.groupBy as 'day' | 'week' | 'month') ?? 'month'
        };
    }

    public async getWasteReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getWasteReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getEfficiencyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getEfficiencyReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getCustomerReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getCustomerReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }

    public async getMachineReport(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getMachineReport(filter);

            if (result.success) {
                res.json({ success: true, data: result.data });
            } else {
                res.status(400).json({ success: false, error: result.error });
            }
        } catch (error) {
            next(error);
        }
    }
}

export function createReportController(reportService: IReportService): ReportController {
    return new ReportController(reportService);
}
