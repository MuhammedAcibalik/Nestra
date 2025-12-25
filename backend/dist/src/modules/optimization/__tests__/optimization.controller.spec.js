"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scenario_controller_1 = require("../scenario.controller");
const interfaces_1 = require("../../../core/interfaces");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ScenarioController', () => {
    let controller;
    let service;
    let req;
    let res;
    let next;
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
        service = (0, jest_mock_extended_1.mock)();
        req = (0, jest_mock_extended_1.mock)();
        res = (0, jest_mock_extended_1.mock)();
        next = jest.fn();
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        controller = new scenario_controller_1.ScenarioController(service);
    });
    describe('createScenario', () => {
        it('should create scenario successfully', async () => {
            const authReq = req;
            authReq.user = { userId: 'user-1', email: 'test@example.com', roleId: 'role-1', roleName: 'admin' };
            authReq.body = { name: 'Test Scenario', cuttingJobId: 'job-1' };
            service.createScenario.mockResolvedValue((0, interfaces_1.success)(mockScenario));
            await controller.createScenario(authReq, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockScenario
            });
        });
        it('should handle errors', async () => {
            const authReq = req;
            authReq.user = { userId: 'user-1', email: 'test@example.com', roleId: 'role-1', roleName: 'admin' };
            service.createScenario.mockResolvedValue((0, interfaces_1.failure)({ code: 'ERROR', message: 'Error' }));
            await controller.createScenario(authReq, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
    describe('getScenarioById', () => {
        it('should return scenario if found', async () => {
            req.params = { id: 'sc-1' };
            service.getScenarioById.mockResolvedValue((0, interfaces_1.success)(mockScenario));
            await controller.getScenarioById(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockScenario
            });
        });
        it('should return 404 if not found', async () => {
            req.params = { id: 'sc-1' };
            service.getScenarioById.mockResolvedValue((0, interfaces_1.failure)({ code: 'SCENARIO_NOT_FOUND', message: 'Not found' }));
            await controller.getScenarioById(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
    describe('runOptimization', () => {
        it('should start optimization', async () => {
            req.params = { id: 'sc-1' };
            const mockPlan = { id: 'plan-1', planNumber: 'PLAN-001' };
            service.runOptimization.mockResolvedValue((0, interfaces_1.success)(mockPlan));
            await controller.runOptimization(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPlan
            });
        });
    });
});
//# sourceMappingURL=optimization.controller.spec.js.map