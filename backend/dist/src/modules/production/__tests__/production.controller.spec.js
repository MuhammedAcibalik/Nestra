"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const production_controller_1 = require("../production.controller");
const interfaces_1 = require("../../../core/interfaces");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ProductionController', () => {
    let controller;
    let service;
    let req;
    let res;
    let next;
    const mockLogDto = {
        id: 'log-1',
        cuttingPlanId: 'plan-1',
        planNumber: 'PN-001',
        operatorName: 'John Doe',
        status: 'STARTED',
        startedAt: new Date(),
        notes: 'Test note'
    };
    beforeEach(() => {
        service = (0, jest_mock_extended_1.mock)();
        req = (0, jest_mock_extended_1.mock)();
        res = (0, jest_mock_extended_1.mock)();
        next = jest.fn();
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        controller = new production_controller_1.ProductionController(service);
    });
    describe('startProduction', () => {
        it('should start production successfully', async () => {
            const authReq = req;
            // Cast to any to avoid strict checks on ITokenPayload compatibility during test
            authReq.user = { userId: 'user-1', email: 'test@test.com', role: 'operator' };
            authReq.params = { planId: 'plan-1' };
            service.startProduction.mockResolvedValue((0, interfaces_1.success)(mockLogDto));
            await controller.startProduction(authReq, res, next);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockLogDto
            });
            expect(service.startProduction).toHaveBeenCalledWith('plan-1', 'user-1');
        });
        it('should return 404 if plan not found', async () => {
            const authReq = req;
            authReq.user = { userId: 'user-1' };
            authReq.params = { planId: 'plan-1' };
            service.startProduction.mockResolvedValue((0, interfaces_1.failure)({ code: 'PLAN_NOT_FOUND', message: 'Not found' }));
            await controller.startProduction(authReq, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
    describe('completeProduction', () => {
        it('should complete production successfully', async () => {
            req.params = { id: 'log-1' };
            req.body = { actualWaste: 10, actualTime: 60 };
            const completedLog = { ...mockLogDto, status: 'COMPLETED', completedAt: new Date() };
            service.completeProduction.mockResolvedValue((0, interfaces_1.success)(completedLog));
            await controller.completeProduction(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: completedLog
            });
            expect(service.completeProduction).toHaveBeenCalledWith('log-1', req.body);
        });
        it('should return 404 if log not found', async () => {
            req.params = { id: 'log-1' };
            service.completeProduction.mockResolvedValue((0, interfaces_1.failure)({ code: 'LOG_NOT_FOUND', message: 'Not found' }));
            await controller.completeProduction(req, res, next);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
    describe('getApprovedPlans', () => {
        it('should return approved plans', async () => {
            const mockPlans = [{
                    id: 'plan-1',
                    planNumber: 'PN-001',
                    status: 'APPROVED',
                    scenarioId: 'sc-1',
                    totalWaste: 0,
                    wastePercentage: 0,
                    stockUsedCount: 0,
                    layoutItems: []
                }];
            service.getApprovedPlans.mockResolvedValue((0, interfaces_1.success)(mockPlans));
            await controller.getApprovedPlans(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockPlans
            });
        });
    });
});
//# sourceMappingURL=production.controller.spec.js.map