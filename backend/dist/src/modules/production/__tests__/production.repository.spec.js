"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const production_repository_1 = require("../production.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ProductionRepository', () => {
    let repository;
    let prisma;
    let prismaLog;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaLog = (0, jest_mock_extended_1.mock)();
        prisma.productionLog = prismaLog;
        repository = new production_repository_1.ProductionRepository(prisma);
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
            prismaLog.create.mockResolvedValue(mockLog);
            // Time mocking
            jest.useFakeTimers().setSystemTime(mockLog.startedAt);
            const result = await repository.create(planId, operatorId);
            expect(result).toEqual(mockLog);
            expect(prismaLog.create).toHaveBeenCalledWith({
                data: {
                    cuttingPlanId: planId,
                    operatorId,
                    status: 'STARTED',
                    startedAt: mockLog.startedAt
                }
            });
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
            prismaLog.update.mockResolvedValue(mockLog);
            jest.useFakeTimers().setSystemTime(mockLog.completedAt);
            const result = await repository.complete('log-1', input);
            expect(result).toEqual(mockLog);
            expect(prismaLog.update).toHaveBeenCalledWith({
                where: { id: 'log-1' },
                data: expect.objectContaining({
                    status: 'COMPLETED',
                    actualWaste: 5.5,
                    completedAt: mockLog.completedAt
                })
            });
            jest.useRealTimers();
        });
    });
});
//# sourceMappingURL=production.repository.spec.js.map