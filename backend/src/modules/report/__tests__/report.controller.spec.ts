import { ReportController } from '../report.controller';
import { IReportService, success, failure } from '../../../core/interfaces';
import { Request, Response, NextFunction } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';

describe('ReportController', () => {
    let controller: ReportController;
    let service: MockProxy<IReportService>;
    let req: MockProxy<Request>;
    let res: MockProxy<Response>;
    let next: MockProxy<NextFunction>;

    beforeEach(() => {
        service = mock<IReportService>();
        req = mock<Request>();
        res = mock<Response>();
        next = jest.fn();

        res.status.mockReturnValue(res);
        res.json.mockReturnValue(res);

        controller = new ReportController(service);
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

            service.getWasteReport.mockResolvedValue(success(mockWasteData));

            await controller.getWasteReport(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockWasteData
            });
            // Verify query parsing and service call
            expect(service.getWasteReport).toHaveBeenCalledWith(
                expect.objectContaining({
                    startDate: new Date('2023-01-01'),
                    groupBy: 'month'
                })
            );
        });

        it('should handle service errors', async () => {
            req.query = {};
            service.getWasteReport.mockResolvedValue(failure({ code: 'ERROR', message: 'Test error' }));

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
            service.getEfficiencyReport.mockResolvedValue(success(mockEfficiencyData));

            await controller.getEfficiencyReport(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockEfficiencyData
            });
        });
    });

    describe('getCustomerReport', () => {
        it('should return customer report data', async () => {
            const mockCustomerData = [
                {
                    customerId: 'c1',
                    customerName: 'C1',
                    customerCode: 'C01',
                    orderCount: 1,
                    itemCount: 10,
                    planCount: 1,
                    totalWaste: 5,
                    avgWaste: 5
                }
            ];
            service.getCustomerReport.mockResolvedValue(success(mockCustomerData));

            await controller.getCustomerReport(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockCustomerData
            });
        });
    });

    describe('getMachineReport', () => {
        it('should return machine report data', async () => {
            const mockMachineData = [
                {
                    machineId: 'm1',
                    machineName: 'M1',
                    machineCode: 'M01',
                    machineType: 'Type1',
                    planCount: 2,
                    totalProductionTime: 120,
                    avgWastePercentage: 5
                }
            ];
            service.getMachineReport.mockResolvedValue(success(mockMachineData));

            await controller.getMachineReport(req, res, next);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMachineData
            });
        });
    });
});
