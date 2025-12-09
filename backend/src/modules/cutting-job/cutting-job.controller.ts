/**
 * CuttingJob Controller
 * Following SRP - Only handles HTTP request/response
 */

import { Router, Request, Response } from 'express';
import { ICuttingJobService } from './cutting-job.service';
import { ICuttingJobFilter, ICreateCuttingJobInput } from './cutting-job.repository';
import { validate, validateId } from '../../core/validation';
import { createCuttingJobSchema, updateCuttingJobStatusSchema, addJobItemSchema } from '../../core/validation/schemas';

export class CuttingJobController {
    public readonly router: Router;

    constructor(private readonly service: ICuttingJobService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // GET /api/cutting-jobs - List all jobs
        this.router.get('/', this.getJobs.bind(this));

        // GET /api/cutting-jobs/:id - Get single job
        this.router.get('/:id', validateId(), this.getJobById.bind(this));

        // POST /api/cutting-jobs - Create new job
        this.router.post('/', validate(createCuttingJobSchema), this.createJob.bind(this));

        // POST /api/cutting-jobs/auto-generate - Auto-generate jobs from confirmed orders
        this.router.post('/auto-generate', this.autoGenerate.bind(this));

        // PATCH /api/cutting-jobs/:id/status - Update job status
        this.router.patch('/:id/status', validateId(), validate(updateCuttingJobStatusSchema), this.updateStatus.bind(this));

        // POST /api/cutting-jobs/:id/items - Add item to job
        this.router.post('/:id/items', validateId(), validate(addJobItemSchema), this.addItem.bind(this));

        // DELETE /api/cutting-jobs/:id/items/:orderItemId - Remove item from job
        this.router.delete('/:id/items/:orderItemId', validateId(), this.removeItem.bind(this));

        // DELETE /api/cutting-jobs/:id - Delete job
        this.router.delete('/:id', validateId(), this.deleteJob.bind(this));
    }

    public async getJobs(req: Request, res: Response): Promise<void> {
        const filter: ICuttingJobFilter = {
            status: req.query.status as string | undefined,
            materialTypeId: req.query.materialTypeId as string | undefined,
            thickness: req.query.thickness ? Number.parseFloat(req.query.thickness as string) : undefined
        };

        const result = await this.service.getJobs(filter);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

    public async getJobById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.service.getJobById(id);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

    public async createJob(req: Request, res: Response): Promise<void> {
        // Body is already validated by middleware
        const data = req.body as ICreateCuttingJobInput;
        const result = await this.service.createJob(data);

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

    public async autoGenerate(req: Request, res: Response): Promise<void> {
        const confirmedOnly = req.body.confirmedOnly !== false;
        const result = await this.service.autoGenerateFromOrders(confirmedOnly);

        if (result.success) {
            res.status(201).json({
                success: true,
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    }

    public async updateStatus(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        // Body is already validated by middleware
        const { status } = req.body;
        const result = await this.service.updateJobStatus(id, status);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

    public async addItem(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        // Body is already validated by middleware
        const { orderItemId, quantity } = req.body;
        const result = await this.service.addItemToJob(id, orderItemId, quantity);

        if (result.success) {
            res.json({
                success: true,
                data: result.data
            });
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

    public async removeItem(req: Request, res: Response): Promise<void> {
        const { id, orderItemId } = req.params;
        const result = await this.service.removeItemFromJob(id, orderItemId);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }

    public async deleteJob(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.service.deleteJob(id);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'JOB_NOT_FOUND' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: result.error
            });
        }
    }
}
