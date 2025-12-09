/**
 * CuttingJob Controller
 * Following SRP - Only handles HTTP request/response
 */
import { Router, Request, Response } from 'express';
import { ICuttingJobService } from './cutting-job.service';
export declare class CuttingJobController {
    private readonly service;
    readonly router: Router;
    constructor(service: ICuttingJobService);
    private initializeRoutes;
    getJobs(req: Request, res: Response): Promise<void>;
    getJobById(req: Request, res: Response): Promise<void>;
    createJob(req: Request, res: Response): Promise<void>;
    autoGenerate(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    addItem(req: Request, res: Response): Promise<void>;
    removeItem(req: Request, res: Response): Promise<void>;
    deleteJob(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=cutting-job.controller.d.ts.map