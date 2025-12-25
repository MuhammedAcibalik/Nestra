import { ScenarioController } from '../scenario.controller';
import { IOptimizationService, success, failure } from '../../../core/interfaces';
import { Request, Response, NextFunction } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { AuthenticatedRequest } from '../../../middleware/authMiddleware';

describe('ScenarioController', () => {
    let controller: ScenarioController;
    let service: MockProxy<IOptimizationService>;
    let req: MockProxy<Request>;
    let res: MockProxy<Response>;
    let next: MockProxy<NextFunction>;

    const mockScenario = {
        id: 'sc-1',
        name: 'Test Scenario',
        cuttingJobId: 'job-1',
        status: 'PENDING',
        parameters: {},
        resultCount: 0,
        createdAt: new Date()
    };

    beforeEach(() => {
        service = mock<IOptimizationService>();
        req = mock<Request>();
        res = mock<Response>();
        next = jest.fn();

        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);

        controller = new ScenarioController(service);
    });

    describe('createScenario', () => {
        it('should create scenario successfully', async () => {
            const authReq = req as unknown as MockProxy<AuthenticatedRequest>;
            authReq.user = { userId: 'user-1', email: 'test@example.com', roleId: 'role-1', roleName: 'admin' } as any;
            authReq.body = { name: 'Test Scenario', cuttingJobId: 'job-1' };

            service.createScenario.mockResolvedValue(success(mockScenario));

            await controller.createScenario(authReq, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockScenario
            });
        });

        it('should handle errors', async () => {
            const authReq = req as unknown as MockProxy<AuthenticatedRequest>;
            authReq.user = { userId: 'user-1', email: 'test@example.com', roleId: 'role-1', roleName: 'admin' } as any;
            service.createScenario.mockResolvedValue(failure({ code: 'ERROR', message: 'Error' }));

            await controller.createScenario(authReq, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('getScenarioById', () => {
        it('should return scenario if found', async () => {
            req.params = { id: 'sc-1' };
            service.getScenarioById.mockResolvedValue(success(mockScenario as any));

            await controller.getScenarioById(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockScenario
            });
        });

        it('should return 404 if not found', async () => {
            req.params = { id: 'sc-1' };
            service.getScenarioById.mockResolvedValue(failure({ code: 'SCENARIO_NOT_FOUND', message: 'Not found' }));

            await controller.getScenarioById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe('runOptimization', () => {
        it('should start optimization', async () => {
            req.params = { id: 'sc-1' };
            const mockPlan = { id: 'plan-1', planNumber: 'PLAN-001' };
            service.runOptimization.mockResolvedValue(success(mockPlan as any));

            await controller.runOptimization(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPlan
            });
        });
    });
});
