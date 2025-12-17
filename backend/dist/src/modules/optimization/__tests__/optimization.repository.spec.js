"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optimization_repository_1 = require("../optimization.repository");
const db_mock_1 = require("../../../core/test/db-mock");
describe('OptimizationRepository', () => {
    let repository;
    let db;
    beforeEach(() => {
        db = (0, db_mock_1.createMockDatabase)();
        repository = new optimization_repository_1.OptimizationRepository(db);
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
            const mockScenario = { id: 'scen-1', ...input, status: 'PENDING' };
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockScenario])
                })
            });
            const result = await repository.createScenario(input, 'user-1');
            expect(result.id).toBe('scen-1');
            expect(result.name).toBe('Scenario 1');
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
            const mockPlan = { id: 'plan-1', planNumber: 'PLN-000001', scenarioId: 'scen-1', ...input };
            db.select.mockReturnValue({
                from: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue([{ count: 0 }])
                })
            });
            db.insert.mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockPlan])
                })
            });
            const result = await repository.createPlan('scen-1', input);
            expect(result.id).toBe('plan-1');
            expect(result.planNumber).toBe('PLN-000001');
        });
    });
    describe('updateScenarioStatus', () => {
        it('should update status', async () => {
            const mockScenario = { id: 'scen-1', status: 'COMPLETED' };
            db.update.mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([mockScenario])
                    })
                })
            });
            const result = await repository.updateScenarioStatus('scen-1', 'COMPLETED');
            expect(result.status).toBe('COMPLETED');
        });
    });
});
//# sourceMappingURL=optimization.repository.spec.js.map