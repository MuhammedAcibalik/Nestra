import { CuttingJobController } from '../cutting-job.controller';
import { ICuttingJobService, ICuttingJobDto } from '../cutting-job.service';
import { Request, Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { success, failure } from '../../../core/interfaces';

// Mock express with CommonJS/ESM interop support
jest.mock('express', () => {
    const mockRouter = {
        get: jest.fn(),
        post: jest.fn(),
        patch: jest.fn(),
        delete: jest.fn(),
        put: jest.fn()
    };
    return {
        __esModule: true,
        default: {
            Router: () => mockRouter
        },
        Router: () => mockRouter
    };
});

// Mock validation
jest.mock('../../../core/validation', () => ({
    validate: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
    validateId: jest.fn(() => (_req: unknown, _res: unknown, next: () => void) => next())
}));

jest.mock('../../../core/validation/schemas', () => ({
    createCuttingJobSchema: {},
    updateCuttingJobStatusSchema: {},
    addJobItemSchema: {}
}));

describe('CuttingJobController', () => {
    let controller: CuttingJobController;
    let service: MockProxy<ICuttingJobService>;
    let req: MockProxy<Request>;
    let res: MockProxy<Response>;

    beforeEach(() => {
        service = mock<ICuttingJobService>();
        req = mock<Request>();
        res = mock<Response>();

        // Mock Response methods to return 'this' for chaining if needed, or just standard mocks
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        res.send.mockReturnValue(res);

        controller = new CuttingJobController(service);
    });

    describe('getJobs', () => {
        it('should return jobs on success', async () => {
            const jobs: ICuttingJobDto[] = [
                {
                    id: 'job-1',
                    jobNumber: 'JOB-001',
                    materialTypeId: 'mat-1',
                    thickness: 18,
                    status: 'PENDING',
                    itemCount: 0,
                    scenarioCount: 0,
                    createdAt: new Date()
                }
            ];
            service.getJobs.mockResolvedValue(success(jobs));

            req.query = {};

            await controller.getJobs(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: jobs
            });
        });
    });

    describe('createJob', () => {
        it('should create job successfully', async () => {
            const input = { materialTypeId: 'mat-1', thickness: 18, orderItemIds: [] };
            const job: ICuttingJobDto = {
                id: 'job-1',
                jobNumber: 'JOB-001',
                ...input,
                status: 'PENDING',
                itemCount: 0,
                scenarioCount: 0,
                createdAt: new Date()
            };

            req.body = input;
            service.createJob.mockResolvedValue(success(job));

            await controller.createJob(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: job
            });
        });
    });

    describe('autoGenerate', () => {
        it('should auto-generate jobs', async () => {
            const result = { createdJobs: [], skippedItems: [] };
            req.body = { confirmedOnly: true };
            service.autoGenerateFromOrders.mockResolvedValue(success(result));

            await controller.autoGenerate(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: result
            });
        });
    });

    describe('getJobById', () => {
        it('should return job if found', async () => {
            const job: ICuttingJobDto = {
                id: 'job-1',
                jobNumber: 'JOB-001',
                materialTypeId: 'mat-1',
                thickness: 18,
                status: 'PENDING',
                itemCount: 0,
                scenarioCount: 0,
                createdAt: new Date()
            };
            req.params = { id: 'job-1' };
            service.getJobById.mockResolvedValue(success(job));

            await controller.getJobById(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: job
            });
        });

        it('should return 404 if not found', async () => {
            req.params = { id: 'job-1' };
            service.getJobById.mockResolvedValue(failure({ code: 'JOB_NOT_FOUND', message: 'Not found' }));

            await controller.getJobById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false
                })
            );
        });
    });

    describe('updateStatus', () => {
        it('should update status successfully', async () => {
            const job: ICuttingJobDto = {
                id: 'job-1',
                jobNumber: 'JOB-001',
                materialTypeId: 'mat-1',
                thickness: 18,
                status: 'OPTIMIZING',
                itemCount: 0,
                scenarioCount: 0,
                createdAt: new Date()
            };
            req.params = { id: 'job-1' };
            req.body = { status: 'OPTIMIZING' };
            service.updateJobStatus.mockResolvedValue(success(job));

            await controller.updateStatus(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: job
            });
        });
    });

    describe('addItem', () => {
        it('should add item successfully', async () => {
            const job: ICuttingJobDto = {
                id: 'job-1',
                jobNumber: 'JOB-001',
                materialTypeId: 'mat-1',
                thickness: 18,
                status: 'PENDING',
                itemCount: 1,
                scenarioCount: 0,
                createdAt: new Date()
            };
            req.params = { id: 'job-1' };
            req.body = { orderItemId: 'item-1', quantity: 5 };
            service.addItemToJob.mockResolvedValue(success(job));

            await controller.addItem(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: job
            });
        });
    });

    describe('removeItem', () => {
        it('should remove item successfully', async () => {
            req.params = { id: 'job-1', orderItemId: 'item-1' };
            service.removeItemFromJob.mockResolvedValue(success(undefined));

            await controller.removeItem(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('deleteJob', () => {
        it('should delete job successfully', async () => {
            req.params = { id: 'job-1' };
            service.deleteJob.mockResolvedValue(success(undefined));

            await controller.deleteJob(req, res);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});
