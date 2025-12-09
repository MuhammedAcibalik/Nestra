"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cutting_job_repository_1 = require("../cutting-job.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('CuttingJobRepository', () => {
    let repository;
    let prisma;
    let prismaJob;
    let prismaJobItem;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaJob = (0, jest_mock_extended_1.mock)();
        prismaJobItem = (0, jest_mock_extended_1.mock)();
        prisma.cuttingJob = prismaJob;
        prisma.cuttingJobItem = prismaJobItem;
        repository = new cutting_job_repository_1.CuttingJobRepository(prisma);
    });
    describe('create', () => {
        it('should create cutting job', async () => {
            const materialTypeId = 'mat-1';
            const thickness = 18;
            const items = [{ orderItemId: 'order-item-1', quantity: 2 }];
            prismaJob.count.mockResolvedValue(0);
            const mockJob = {
                id: 'job-1',
                jobNumber: 'JOB-2305-00001',
                materialTypeId,
                thickness,
                status: 'PENDING'
            };
            prismaJob.create.mockResolvedValue(mockJob);
            // Mock Date for consistent job number generation
            jest.useFakeTimers().setSystemTime(new Date('2023-05-01'));
            const result = await repository.create(materialTypeId, thickness, items);
            expect(result).toEqual(mockJob);
            expect(prismaJob.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    materialTypeId,
                    thickness,
                    status: 'PENDING',
                    items: {
                        create: [{ orderItemId: 'order-item-1', quantity: 2 }]
                    }
                })
            });
            jest.useRealTimers();
        });
    });
    describe('updateStatus', () => {
        it('should update job status', async () => {
            const mockJob = { id: 'job-1', status: 'OPTIMIZING' };
            prismaJob.update.mockResolvedValue(mockJob);
            const result = await repository.updateStatus('job-1', 'OPTIMIZING');
            expect(result).toEqual(mockJob);
            expect(prismaJob.update).toHaveBeenCalledWith({
                where: { id: 'job-1' },
                data: { status: 'OPTIMIZING' }
            });
        });
    });
    describe('addItem', () => {
        it('should add item to job', async () => {
            const input = { orderItemId: 'order-item-2', quantity: 5 };
            const mockItem = { id: 'job-item-1', cuttingJobId: 'job-1', ...input };
            prismaJobItem.create.mockResolvedValue(mockItem);
            const result = await repository.addItem('job-1', input);
            expect(result).toEqual(mockItem);
            expect(prismaJobItem.create).toHaveBeenCalledWith({
                data: {
                    cuttingJobId: 'job-1',
                    orderItemId: input.orderItemId,
                    quantity: input.quantity
                }
            });
        });
    });
    describe('findByMaterialAndThickness', () => {
        it('should find jobs by material criteria', async () => {
            const mockJobs = [{ id: 'job-1', materialTypeId: 'mat-1', thickness: 18 }];
            prismaJob.findMany.mockResolvedValue(mockJobs);
            const result = await repository.findByMaterialAndThickness('mat-1', 18, 'PENDING');
            expect(result).toEqual(mockJobs);
            expect(prismaJob.findMany).toHaveBeenCalledWith({
                where: {
                    materialTypeId: 'mat-1',
                    thickness: 18,
                    status: 'PENDING'
                },
                include: expect.any(Object)
            });
        });
    });
});
//# sourceMappingURL=cutting-job.repository.spec.js.map