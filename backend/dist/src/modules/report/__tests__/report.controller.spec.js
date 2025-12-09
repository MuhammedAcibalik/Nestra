"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_controller_1 = require("../report.controller");
const interfaces_1 = require("../../../core/interfaces");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ReportController', () => {
    let controller;
    let service;
    let req;
    let res;
    let next;
    beforeEach(() => {
        service = (0, jest_mock_extended_1.mock)();
        req = (0, jest_mock_extended_1.mock)();
        res = (0, jest_mock_extended_1.mock)();
        next = jest.fn();
        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);
        controller = new report_controller_1.ReportController(service);
    });
    describe('getWasteReport', () => {
        it('should return waste report data', async () => {
            req.query = { startDate: '2023-01-01', groupBy: 'month' };
            const mockWasteData = {
                summary: {
                    totalPlans: 10,
                    totalPlannedWaste: 100,
                    totalActualWaste: 110,
                    avgWastePercentage: 10,
                    wasteVariance: 10
                },
                byPeriod: []
            };
            service.getWasteReport.mockResolvedValue((0, interfaces_1.success)(mockWasteData));
            await controller.getWasteReport(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockWasteData
            });
            // Verify query parsing and service call
            expect(service.getWasteReport).toHaveBeenCalledWith(expect.objectContaining({
                startDate: new Date('2023-01-01'),
                groupBy: 'month'
            }));
        });
        it('should handle service errors', async () => {
            req.query = {};
            service.getWasteReport.mockResolvedValue((0, interfaces_1.failure)({ code: 'ERROR', message: 'Test error' }));
            await controller.getWasteReport(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
    describe('getEfficiencyReport', () => {
        it('should return efficiency report data', async () => {
            const mockEfficiencyData = {
                overall: { totalPlans: 5, avgEfficiency: 95 },
                byMaterial: []
            };
            service.getEfficiencyReport.mockResolvedValue((0, interfaces_1.success)(mockEfficiencyData));
            await controller.getEfficiencyReport(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEfficiencyData
            });
        });
    });
    describe('getCustomerReport', () => {
        it('should return customer report data', async () => {
            const mockCustomerData = [{
                    customerId: 'c1',
                    customerName: 'C1',
                    customerCode: 'C01',
                    orderCount: 1,
                    itemCount: 10,
                    planCount: 1,
                    totalWaste: 5,
                    avgWaste: 5
                }];
            service.getCustomerReport.mockResolvedValue((0, interfaces_1.success)(mockCustomerData));
            await controller.getCustomerReport(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCustomerData
            });
        });
    });
    describe('getMachineReport', () => {
        it('should return machine report data', async () => {
            const mockMachineData = [{
                    machineId: 'm1',
                    machineName: 'M1',
                    machineCode: 'M01',
                    machineType: 'Type1',
                    planCount: 2,
                    totalProductionTime: 120,
                    avgWastePercentage: 5
                }];
            service.getMachineReport.mockResolvedValue((0, interfaces_1.success)(mockMachineData));
            await controller.getMachineReport(req, res, next);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMachineData
            });
        });
    });
});
//# sourceMappingURL=report.controller.spec.js.map