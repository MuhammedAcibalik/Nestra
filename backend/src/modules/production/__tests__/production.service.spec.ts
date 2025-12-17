import { ProductionService } from '../production.service';
import { IProductionRepository, ProductionLogWithRelations } from '../production.repository';
import { IOptimizationServiceClient, IStockServiceClient, IServiceResponse, IPlanSummary, IPlanStockItem } from '../../../core/services';
import { EventBus } from '../../../core/events';
import { mock, MockProxy } from 'jest-mock-extended';

// Create mock log that satisfies ProductionLogWithRelations
function createMockLog(overrides: Partial<ProductionLogWithRelations> = {}): ProductionLogWithRelations {
    return {
        id: 'log-1',
        cuttingPlanId: 'plan-1',
        operatorId: 'op-1',
        status: 'STARTED',
        actualTime: null,
        actualWaste: null,
        notes: null,
        issues: null,
        startedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        cuttingPlan: { planNumber: 'PLN-001' },
        operator: { id: 'op-1', firstName: 'Test', lastName: 'Operator' },
        ...overrides
    } as ProductionLogWithRelations;
}

// Mock plan from service client
function createMockPlanResponse(overrides?: Partial<IPlanSummary>): IServiceResponse<IPlanSummary> {
    return {
        success: true,
        data: {
            id: 'plan-1',
            planNumber: 'PLN-001',
            scenarioId: 'scenario-1',
            status: 'APPROVED',
            totalWaste: 100,
            wastePercentage: 5,
            stockUsedCount: 2,
            ...overrides
        }
    };
}

describe('ProductionService', () => {
    let service: ProductionService;
    let repository: MockProxy<IProductionRepository>;
    let optimizationClient: MockProxy<IOptimizationServiceClient>;
    let stockClient: MockProxy<IStockServiceClient>;
    let eventBusPublishSpy: jest.SpyInstance;

    beforeEach(() => {
        repository = mock<IProductionRepository>();
        optimizationClient = mock<IOptimizationServiceClient>();
        stockClient = mock<IStockServiceClient>();
        service = new ProductionService(repository, optimizationClient, stockClient);

        // Mock EventBus
        const eventBus = EventBus.getInstance();
        eventBusPublishSpy = jest.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('startProduction', () => {
        it('should start production for approved plan', async () => {
            const log = createMockLog();

            optimizationClient.getPlanById.mockResolvedValue(createMockPlanResponse());
            optimizationClient.updatePlanStatus.mockResolvedValue({ success: true });
            repository.findByPlanId.mockResolvedValue(null); // No existing log
            repository.create.mockResolvedValue(log);
            repository.findById.mockResolvedValue(log);

            const result = await service.startProduction('plan-1', 'op-1');

            expect(result.success).toBe(true);
            expect(repository.create).toHaveBeenCalledWith('plan-1', 'op-1');
            expect(optimizationClient.updatePlanStatus).toHaveBeenCalledWith('plan-1', 'IN_PRODUCTION');

            // Event check
            expect(eventBusPublishSpy).toHaveBeenCalled();
            const event = eventBusPublishSpy.mock.calls[0][0];
            expect(event.eventType).toBe('production.started');
        });

        it('should fail if plan not approved', async () => {
            optimizationClient.getPlanById.mockResolvedValue(createMockPlanResponse({ status: 'DRAFT' }));

            const result = await service.startProduction('plan-1', 'op-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INVALID_STATUS');
        });

        it('should fail if plan not found', async () => {
            optimizationClient.getPlanById.mockResolvedValue({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } });

            const result = await service.startProduction('plan-1', 'op-1');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('PLAN_NOT_FOUND');
        });
    });

    describe('completeProduction', () => {
        it('should complete production, consume stock via service client', async () => {
            const log = createMockLog();
            const input = { actualWaste: 10, actualTime: 60, notes: 'Smooth run' };
            const stockItems: IPlanStockItem[] = [{ stockItemId: 'stock-1', sequence: 1, waste: 5 }];

            repository.findById.mockResolvedValue(log);
            optimizationClient.getPlanStockItems.mockResolvedValue({ success: true, data: stockItems });
            optimizationClient.updatePlanStatus.mockResolvedValue({ success: true });
            stockClient.createMovement.mockResolvedValue({ success: true, data: { id: 'mov-1' } });
            stockClient.updateQuantity.mockResolvedValue({ success: true });

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

            // Verify service client calls
            expect(repository.complete).toHaveBeenCalledWith('log-1', input);
            expect(optimizationClient.updatePlanStatus).toHaveBeenCalledWith('plan-1', 'COMPLETED');

            // Stock consumption via service client
            expect(stockClient.createMovement).toHaveBeenCalled();
            expect(stockClient.updateQuantity).toHaveBeenCalledWith('stock-1', -1);

            // Event check
            const completedEvent = eventBusPublishSpy.mock.calls.find(call => call[0].eventType === 'production.completed');
            expect(completedEvent).toBeDefined();
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
        it('should update log with issues', async () => {
            const log = createMockLog({ status: 'STARTED' });
            const updatedLog = createMockLog({ status: 'STARTED', notes: 'Machine breakdown' });
            const input = {
                notes: 'Machine breakdown',
                issues: [{ description: 'Motor failure', severity: 'HIGH' }]
            };

            repository.findById
                .mockResolvedValueOnce(log)
                .mockResolvedValueOnce(updatedLog);
            (repository.update as jest.Mock).mockResolvedValue(undefined);

            const result = await service.updateProductionLog('log-1', input);

            expect(result.success).toBe(true);
            expect(repository.update).toHaveBeenCalledWith('log-1', expect.objectContaining({
                notes: input.notes
            }));
        });
    });
});
