"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cutting_job_repository_1 = require("../cutting-job.repository");
const db_mock_1 = require("../../../core/test/db-mock");
const test_factories_1 = require("../../../core/test/test-factories");
describe('CuttingJobRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new cutting_job_repository_1.CuttingJobRepository(db);
    });
    describe('create', () => {
        it('should create cutting job', async () => {
            const input = {
                materialTypeId: 'mat-1',
                thickness: 18,
                orderItemIds: ['order-item-1']
            };
            const mockJob = (0, test_factories_1.createMockCuttingJob)({
                id: 'job-1',
                jobNumber: 'JOB-2305-00001',
                materialTypeId: 'mat-1',
                thickness: 18,
                status: 'PENDING'
            });
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockJob])
                })
            });
            // Mock getOrderItemsByIds
            db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue([
                        { id: 'order-item-1', quantity: 2, materialTypeId: 'mat-1', thickness: 18, itemCode: 'I1', itemName: 'Item 1', length: 100, width: 50, height: 10, geometryType: 'RECTANGLE' }
                    ])
                })
            });
            const result = await repository.create(input);
            expect(result).toEqual(mockJob);
            expect(db.insert).toHaveBeenCalled();
        });
    });
    describe('updateStatus', () => {
        it('should update job status', async () => {
            const mockJob = { id: 'job-1', status: 'OPTIMIZING' };
            db.update.mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([mockJob])
                    })
                })
            });
            const result = await repository.updateStatus('job-1', 'OPTIMIZING');
            expect(result.status).toBe('OPTIMIZING');
        });
    });
    describe('addItem', () => {
        it('should add item to job', async () => {
            const input = { orderItemId: 'order-item-2', quantity: 5 };
            const mockItem = { id: 'job-item-1', cuttingJobId: 'job-1', ...input };
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockItem])
                })
            });
            const result = await repository.addItem('job-1', input);
            expect(result).toEqual(mockItem);
        });
    });
    describe('findByMaterialAndThickness', () => {
        it('should find jobs by material criteria', async () => {
            const mockJobs = [{ id: 'job-1', materialTypeId: 'mat-1', thickness: 18, items: [], _count: { items: 0, scenarios: 0 } }];
            db.query.cuttingJobs.findMany.mockResolvedValue(mockJobs);
            const result = await repository.findByMaterialAndThickness('mat-1', 18, 'PENDING');
            expect(result).toHaveLength(1);
            expect(result[0].materialTypeId).toBe('mat-1');
        });
    });
});
//# sourceMappingURL=cutting-job.repository.spec.js.map