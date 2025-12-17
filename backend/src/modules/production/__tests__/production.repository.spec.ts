import { ProductionRepository } from '../production.repository';
import { createMockDatabase, MockProxy } from '../../../core/test/db-mock';
import { Database } from '../../../db';

describe('ProductionRepository', () => {
    let repository: ProductionRepository;
    let db: MockProxy<Database>;

    beforeEach(() => {
        db = createMockDatabase();
        repository = new ProductionRepository(db);
    });

    describe('create', () => {
        it('should create production log', async () => {
            const planId = 'plan-1';
            const operatorId = 'user-1';
            const mockLog = {
                id: 'log-1',
                cuttingPlanId: planId,
                operatorId,
                status: 'STARTED',
                startedAt: new Date()
            };

            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockLog])
                })
            });

            // Time mocking
            jest.useFakeTimers().setSystemTime(mockLog.startedAt);

            const result = await repository.create(planId, operatorId);

            expect(result.id).toBe('log-1');
            expect(result.cuttingPlanId).toBe(planId);
            expect(result.status).toBe('STARTED');

            jest.useRealTimers();
        });
    });

    describe('complete', () => {
        it('should complete production log', async () => {
            const input = {
                actualWaste: 5.5,
                actualTime: 120,
                notes: 'Done'
            };
            const mockLog = {
                id: 'log-1',
                status: 'COMPLETED',
                completedAt: new Date(),
                ...input
            };

            (db.update as jest.Mock).mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([mockLog])
                    })
                })
            });

            jest.useFakeTimers().setSystemTime(mockLog.completedAt);

            const result = await repository.complete('log-1', input);

            expect(result.status).toBe('COMPLETED');
            expect(result.actualWaste).toBe(5.5);

            jest.useRealTimers();
        });
    });
});
