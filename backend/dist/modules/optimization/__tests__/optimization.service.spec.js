"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const optimization_service_1 = require("../optimization.service");
// import { OptimizationStrategyRegistry } from '../optimization.strategy';
const jest_mock_extended_1 = require("jest-mock-extended");
// Mock the strategy registry class entirely
jest.mock('../optimization.strategy', () => {
    return {
        OptimizationStrategyRegistry: jest.fn().mockImplementation(() => ({
            get1DStrategy: jest.fn().mockReturnValue({ optimize: jest.fn() }),
            get2DStrategy: jest.fn().mockReturnValue({ optimize: jest.fn() })
        }))
    };
});
// Import after mock
describe('OptimizationService', () => {
    let service;
    let repository;
    const createMockScenario = (overrides = {}) => ({
        id: 'sc-1',
        name: 'Test Scenario',
        cuttingJobId: 'job-1',
        status: 'PENDING',
        parameters: {},
        useWarehouseStock: true,
        useStandardSizes: false,
        selectedStockIds: [],
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { results: 0 },
        ...overrides
    });
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        service = new optimization_service_1.OptimizationService(repository);
    });
    describe('createScenario', () => {
        it('should create scenario successfully', async () => {
            const input = {
                name: 'Test Scenario',
                cuttingJobId: 'job-1',
                parameters: {
                    constraints: {
                        algorithm: 'GR_BEST_FIT',
                        allowRotation: true
                    }
                }
            };
            const mockScenario = createMockScenario({
                id: 'sc-1',
                name: input.name,
                cuttingJobId: input.cuttingJobId
            });
            repository.createScenario.mockResolvedValue(mockScenario);
            repository.findScenarioById.mockResolvedValue(mockScenario);
            const result = await service.createScenario(input, 'user-1');
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('sc-1');
            expect(repository.createScenario).toHaveBeenCalledWith(input, 'user-1');
        });
        it.each([
            [{ name: '', cuttingJobId: 'job-1' }, 'name'],
            [{ name: 'Test', cuttingJobId: '' }, 'cuttingJobId'],
            // Add more invalid cases here if needed, e.g. undefined (though TS prevents it mostly)
        ])('should fail validation when %s is invalid (missing %s)', async (input, _field) => {
            // @ts-expect-error Testing runtime validation
            const result = await service.createScenario(input, 'user-1');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('VALIDATION_ERROR');
        });
    });
    describe('runOptimization', () => {
        it('should run optimization successfully (stub)', async () => {
            const scenario = createMockScenario({ id: 'sc-1', status: 'PENDING' });
            repository.findScenarioById.mockResolvedValue(scenario);
            repository.generatePlanNumber.mockResolvedValue('PLAN-001');
            const result = await service.runOptimization('sc-1');
            expect(result.success).toBe(true);
            expect(result.data?.planNumber).toBe('PLAN-001');
            expect(repository.updateScenarioStatus).toHaveBeenCalledWith('sc-1', 'RUNNING');
            // Stub logic verification
        });
        it('should fail if scenario not found', async () => {
            repository.findScenarioById.mockResolvedValue(null);
            const result = await service.runOptimization('sc-1');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('SCENARIO_NOT_FOUND');
        });
    });
    describe('getScenarioById', () => {
        it('should return scenario if found', async () => {
            const mockScenario = createMockScenario({ id: 'sc-1' });
            repository.findScenarioById.mockResolvedValue(mockScenario);
            const result = await service.getScenarioById('sc-1');
            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('sc-1');
        });
    });
});
//# sourceMappingURL=optimization.service.spec.js.map