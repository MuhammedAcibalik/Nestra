"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optimization_repository_1 = require("../optimization.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('OptimizationRepository', () => {
    let repository;
    let prisma;
    let prismaScenario;
    let prismaPlan;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaScenario = (0, jest_mock_extended_1.mock)();
        prismaPlan = (0, jest_mock_extended_1.mock)();
        prisma.optimizationScenario = prismaScenario;
        prisma.cuttingPlan = prismaPlan;
        repository = new optimization_repository_1.OptimizationRepository(prisma);
    });
    describe('createScenario', () => {
        it('should create optimization scenario', async () => {
            const input = {
                name: 'Scenario 1',
                cuttingJobId: 'job-1',
                parameters: {
                    constraints: { algorithm: 'rect_best_fit' }
                }
            };
            const mockScenario = { id: 'scen-1', ...input };
            prismaScenario.create.mockResolvedValue(mockScenario);
            const result = await repository.createScenario(input, 'user-1');
            expect(result).toEqual(mockScenario);
            expect(prismaScenario.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Scenario 1'
                })
            }));
        });
    });
    describe('createPlan', () => {
        it('should create cutting plan', async () => {
            const layoutData = [{
                    stockItemId: 'item-1',
                    sequence: 1,
                    waste: 10,
                    wastePercentage: 5,
                    layoutJson: '{}'
                }];
            const input = {
                totalWaste: 10,
                wastePercentage: 5,
                stockUsedCount: 1,
                layoutData
            };
            prismaPlan.count.mockResolvedValue(0);
            const mockPlan = { id: 'plan-1', planNumber: 'PLN-000001', ...input };
            prismaPlan.create.mockResolvedValue(mockPlan);
            const result = await repository.createPlan('scen-1', input);
            expect(result).toEqual(mockPlan);
            expect(prismaPlan.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    planNumber: 'PLN-000001',
                    scenarioId: 'scen-1',
                    stockItems: {
                        create: expect.arrayContaining([
                            expect.objectContaining({ stockItemId: 'item-1' })
                        ])
                    }
                })
            });
        });
    });
    describe('updateScenarioStatus', () => {
        it('should update status', async () => {
            const mockScenario = { id: 'scen-1', status: 'COMPLETED' };
            prismaScenario.update.mockResolvedValue(mockScenario);
            const result = await repository.updateScenarioStatus('scen-1', 'COMPLETED');
            expect(result).toEqual(mockScenario);
            expect(prismaScenario.update).toHaveBeenCalledWith({
                where: { id: 'scen-1' },
                data: { status: 'COMPLETED' }
            });
        });
    });
});
//# sourceMappingURL=optimization.repository.spec.js.map