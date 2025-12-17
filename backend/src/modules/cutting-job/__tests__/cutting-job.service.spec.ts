import { CuttingJobService } from '../cutting-job.service';
import { ICuttingJobRepository, CuttingJobWithRelations, CuttingJob } from '../cutting-job.repository';
import { EventBus } from '../../../core/events';
import { mock, MockProxy } from 'jest-mock-extended';

const createMockJob = (overrides: Partial<CuttingJobWithRelations> = {}): CuttingJobWithRelations => ({
    id: 'job-1',
    jobNumber: 'JOB-001',
    materialTypeId: 'mat-1',
    thickness: 10,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    _count: { items: 0, scenarios: 0 },
    ...overrides
} as CuttingJobWithRelations);

describe('CuttingJobService', () => {
    let service: CuttingJobService;
    let repository: MockProxy<ICuttingJobRepository>;
    let eventBusPublishSpy: jest.SpyInstance;

    beforeEach(() => {
        repository = mock<ICuttingJobRepository>();
        service = new CuttingJobService(repository);

        // Mock EventBus.publish
        const eventBus = EventBus.getInstance();
        eventBusPublishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getJobById', () => {
        it('should return job if found', async () => {
            const mockJob = createMockJob();
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.getJobById('job-1');

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('job-1');
            expect(repository.findById).toHaveBeenCalledWith('job-1');
        });

        it('should return failure if not found', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.getJobById('job-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('JOB_NOT_FOUND');
        });
    });

    describe('createJob', () => {
        it('should create a cutting job successfully', async () => {
            const input = {
                materialTypeId: 'mat-1',
                thickness: 10,
                orderItemIds: ['item-1']
            };

            const mockJob = createMockJob({ _count: { items: 1, scenarios: 0 } }) as CuttingJob;
            const mockJobWithRelations = createMockJob({ _count: { items: 1, scenarios: 0 } });

            repository.create.mockResolvedValue(mockJob);
            repository.findById.mockResolvedValue(mockJobWithRelations);

            const result = await service.createJob(input);

            expect(result.success).toBe(true);
            expect(repository.create).toHaveBeenCalledWith(input);

            // Verify event
            expect(eventBusPublishSpy).toHaveBeenCalled();
            const event = eventBusPublishSpy.mock.calls[0][0];
            expect(event.eventType).toBe('cutting-job.created');
        });
    });

    describe('getJobs', () => {
        it('should return all jobs', async () => {
            const mockJob = createMockJob();
            repository.findAll.mockResolvedValue([mockJob]);

            const result = await service.getJobs();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data![0].id).toBe('job-1');
        });

        it('should pass filter to repository', async () => {
            repository.findAll.mockResolvedValue([]);
            const filter = { status: 'PENDING' };

            await service.getJobs(filter);

            expect(repository.findAll).toHaveBeenCalledWith(filter);
        });
    });

    describe('updateJobStatus', () => {
        it('should update status successfully', async () => {
            const mockJob = createMockJob({ status: 'PENDING' });
            const updatedJob = createMockJob({ status: 'OPTIMIZING' });

            repository.findById.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(updatedJob);
            repository.updateStatus.mockResolvedValue(updatedJob as CuttingJob);

            const result = await service.updateJobStatus('job-1', 'OPTIMIZING');

            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('OPTIMIZING');
            expect(repository.updateStatus).toHaveBeenCalledWith('job-1', 'OPTIMIZING');
        });

        it('should prevent invalid transition', async () => {
            const mockJob = createMockJob({ status: 'PENDING' });
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.updateJobStatus('job-1', 'COMPLETED');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_STATUS_TRANSITION');
        });
    });

    describe('deleteJob', () => {
        it('should delete job if PENDING', async () => {
            const mockJob = createMockJob({ status: 'PENDING' });
            repository.findById.mockResolvedValue(mockJob);
            repository.delete.mockResolvedValue();

            const result = await service.deleteJob('job-1');

            expect(result.success).toBe(true);
            expect(repository.delete).toHaveBeenCalledWith('job-1');
        });

        it('should fail if job not found', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.deleteJob('job-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('JOB_NOT_FOUND');
        });

        it('should fail if job is not PENDING', async () => {
            const mockJob = createMockJob({ status: 'IN_PRODUCTION' });
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.deleteJob('job-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('CANNOT_DELETE');
        });
    });

    describe('autoGenerateFromOrders', () => {
        it('should create new job for unassigned items', async () => {
            const mockOrderItem = {
                id: 'item-1',
                materialTypeId: 'mat-1',
                thickness: 10,
                quantity: 5,
                itemCode: 'I1',
                itemName: 'Item 1',
                length: 100,
                width: 50,
                height: 10,
                geometryType: 'RECTANGLE'
            };
            repository.getUnassignedOrderItems.mockResolvedValue([mockOrderItem]);
            repository.findByMaterialAndThickness.mockResolvedValue([]);

            const mockJob = createMockJob();
            repository.create.mockResolvedValue(mockJob as CuttingJob);
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.autoGenerateFromOrders(true);

            expect(result.success).toBe(true);
            expect(result.data?.createdJobs).toHaveLength(1);
            expect(repository.create).toHaveBeenCalled();
        });

        it('should add to existing PENDING job', async () => {
            const mockOrderItem = {
                id: 'item-1',
                materialTypeId: 'mat-1',
                thickness: 10,
                quantity: 5,
                itemCode: 'I1',
                itemName: 'Item 1',
                length: 100,
                width: 50,
                height: 10,
                geometryType: 'RECTANGLE'
            };
            repository.getUnassignedOrderItems.mockResolvedValue([mockOrderItem]);

            const existingJob = createMockJob({ id: 'job-EXISTING', status: 'PENDING' });
            repository.findByMaterialAndThickness.mockResolvedValue([existingJob]);
            repository.findById.mockResolvedValue(existingJob);

            const result = await service.autoGenerateFromOrders(true);

            expect(result.success).toBe(true);
            expect(repository.addItem).toHaveBeenCalledWith('job-EXISTING', expect.objectContaining({ orderItemId: 'item-1' }));
            expect(repository.create).not.toHaveBeenCalled();
        });
    });

    describe('addItemToJob', () => {
        it('should add item successfully if job is PENDING', async () => {
            const mockJob = createMockJob({ status: 'PENDING' });
            repository.findById.mockResolvedValueOnce(mockJob).mockResolvedValueOnce(mockJob);
            repository.addItem.mockResolvedValue({ id: 'item-1', cuttingJobId: 'job-1', orderItemId: 'order-item-1', quantity: 5, createdAt: new Date(), updatedAt: new Date() });

            const result = await service.addItemToJob('job-1', 'order-item-1', 5);

            expect(result.success).toBe(true);
            expect(repository.addItem).toHaveBeenCalled();
        });

        it('should fail if job not found', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.addItemToJob('job-1', 'item-1', 1);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('JOB_NOT_FOUND');
        });

        it('should fail if job is not PENDING', async () => {
            const mockJob = createMockJob({ status: 'OPTIMIZED' });
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.addItemToJob('job-1', 'item-1', 1);

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('JOB_NOT_PENDING');
        });
    });

    describe('removeItemFromJob', () => {
        it('should remove item successfully if job is PENDING', async () => {
            const mockJob = createMockJob({ status: 'PENDING' });
            repository.findById.mockResolvedValue(mockJob);
            repository.removeItem.mockResolvedValue();

            const result = await service.removeItemFromJob('job-1', 'item-1');

            expect(result.success).toBe(true);
            expect(repository.removeItem).toHaveBeenCalledWith('job-1', 'item-1');
        });

        it('should fail if job is not PENDING', async () => {
            const mockJob = createMockJob({ status: 'COMPLETED' });
            repository.findById.mockResolvedValue(mockJob);

            const result = await service.removeItemFromJob('job-1', 'item-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('JOB_NOT_PENDING');
        });
    });
});
