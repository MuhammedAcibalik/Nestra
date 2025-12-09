"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const production_service_1 = require("../production.service");
const events_1 = require("../../../core/events");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ProductionService', () => {
    let service;
    let repository;
    let planRepository;
    let stockRepository;
    let eventBusPublishSpy;
    const createMockPlan = (overrides = {}) => ({
        id: 'plan-1',
        planNumber: 'PN-001',
        scenarioId: 'sc-1',
        totalWaste: 10,
        wastePercentage: 5,
        stockUsedCount: 2,
        estimatedTime: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'APPROVED',
        scenario: { id: 'sc-1', name: 'Scenario 1' },
        ...overrides
    });
    const createMockLog = (overrides = {}) => ({
        id: 'log-1',
        cuttingPlanId: 'plan-1',
        operatorId: 'op-1',
        status: 'STARTED',
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        cuttingPlan: { id: 'plan-1', planNumber: 'PN-001', scenario: { name: 'Scenario 1' } },
        operator: { firstName: 'John', lastName: 'Doe' },
        _count: { stockMovements: 0 },
        ...overrides
    });
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        planRepository = (0, jest_mock_extended_1.mock)();
        stockRepository = (0, jest_mock_extended_1.mock)();
        service = new production_service_1.ProductionService(repository, planRepository, stockRepository);
        // Mock EventBus
        const eventBus = events_1.EventBus.getInstance();
        eventBusPublishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('startProduction', () => {
        it('should start production for approved plan', async () => {
            const plan = createMockPlan();
            const log = createMockLog();
            planRepository.findPlanById.mockResolvedValue(plan);
            repository.findByPlanId.mockResolvedValue(null); // No existing log
            repository.create.mockResolvedValue(log);
            repository.findById.mockResolvedValue(log);
            const result = await service.startProduction('plan-1', 'op-1');
            expect(result.success).toBe(true);
            expect(repository.create).toHaveBeenCalledWith('plan-1', 'op-1');
            expect(planRepository.updatePlanStatus).toHaveBeenCalledWith('plan-1', 'IN_PRODUCTION');
            // Event check
            expect(eventBusPublishSpy).toHaveBeenCalled();
            const event = eventBusPublishSpy.mock.calls[0][0];
            expect(event.eventType).toBe('production.started');
        });
        it('should fail if plan not approved', async () => {
            const plan = createMockPlan({ status: 'DRAFT' });
            planRepository.findPlanById.mockResolvedValue(plan);
            const result = await service.startProduction('plan-1', 'op-1');
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_STATUS');
        });
    });
    describe('completeProduction', () => {
        it('should complete production, consume stock, and set completion timestamp', async () => {
            const log = createMockLog();
            const input = { actualWaste: 10, actualTime: 60, notes: 'Smooth run' };
            const stockItems = [{ stockItemId: 'stock-1' }];
            repository.findById.mockResolvedValue(log);
            planRepository.getPlanStockItems.mockResolvedValue(stockItems);
            // Mock return of update to verify it returns completed status
            const completedLog = createMockLog({
                status: 'COMPLETED',
                completedAt: new Date(),
                actualWaste: input.actualWaste,
                actualTime: input.actualTime
            });
            repository.findById.mockResolvedValueOnce(log).mockResolvedValueOnce(completedLog);
            const result = await service.completeProduction('log-1', input);
            expect(result.success).toBe(true);
            expect(result.data?.status).toBe('COMPLETED');
            expect(result.data?.completedAt).toBeDefined();
            // Verify repository calls with correct data
            expect(repository.complete).toHaveBeenCalledWith('log-1', input);
            expect(planRepository.updatePlanStatus).toHaveBeenCalledWith('plan-1', 'COMPLETED');
            // Stock consumption
            expect(stockRepository.createMovement).toHaveBeenCalled();
            expect(stockRepository.updateQuantity).toHaveBeenCalledWith('stock-1', -1);
            // Event check
            const completedEvent = eventBusPublishSpy.mock.calls.find(call => call[0].eventType === 'production.completed');
            expect(completedEvent).toBeDefined();
            expect(completedEvent[0].payload).toMatchObject({
                logId: 'log-1',
                planId: 'plan-1',
                actualWaste: 10
            });
        });
        it('should fail if log is not in STARTED status', async () => {
            const log = createMockLog({ status: 'COMPLETED' });
            repository.findById.mockResolvedValue(log);
            const result = await service.completeProduction('log-1', { actualWaste: 0, actualTime: 0 });
            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_STATUS');
        });
    });
    describe('updateProductionLog', () => {
        it('should update log with issues (downtime simulation)', async () => {
            const log = createMockLog({ status: 'STARTED' });
            const input = {
                notes: 'Machine breakdown',
                issues: [{ description: 'Motor failure', severity: 'HIGH' }]
            };
            repository.findById.mockResolvedValue(log); // Initial fetch
            repository.update.mockResolvedValue(log); // Mock update return - types don't matter as much as checking 'update' call
            repository.findById.mockResolvedValueOnce(log).mockResolvedValueOnce(createMockLog({ ...log, ...input }));
            const result = await service.updateProductionLog('log-1', input);
            expect(result.success).toBe(true);
            expect(repository.update).toHaveBeenCalledWith('log-1', expect.objectContaining({
                notes: input.notes,
                issues: input.issues
            }));
        });
    });
});
//# sourceMappingURL=production.service.spec.js.map