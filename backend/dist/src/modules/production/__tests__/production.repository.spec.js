"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const production_repository_1 = require("../production.repository");
const db_mock_1 = require("../../../core/test/db-mock");
describe('ProductionRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new production_repository_1.ProductionRepository(db);
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
            db.insert.mockReturnValue({
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
            db.update.mockReturnValue({
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
//# sourceMappingURL=production.repository.spec.js.map