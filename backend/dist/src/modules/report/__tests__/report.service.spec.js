"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_service_1 = require("../report.service");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ReportService', () => {
    let service;
    let repository;
    beforeEach(() => {
        repository = (0, jest_mock_extended_1.mock)();
        service = new report_service_1.ReportService(repository);
    });
    describe('getWasteReport', () => {
        it('should calculate waste summary and grouping correctly', async () => {
            const mockWasteData = [
                {
                    date: new Date('2023-01-01'),
                    createdAt: new Date('2023-01-01'),
                    materialTypeName: 'MDF',
                    totalWaste: 10,
                    plannedWaste: 10,
                    actualWaste: 12,
                    wastePercentage: 5,
                    planCount: 1
                },
                {
                    date: new Date('2023-01-02'),
                    createdAt: new Date('2023-01-02'),
                    materialTypeName: 'MDF',
                    totalWaste: 20,
                    plannedWaste: 20,
                    actualWaste: 20,
                    wastePercentage: 10,
                    planCount: 1
                }
            ];
            repository.getWasteData.mockResolvedValue(mockWasteData);
            const result = await service.getWasteReport({ groupBy: 'month' });
            expect(result.success).toBe(true);
            const summary = result.data?.summary;
            expect(summary?.totalPlans).toBe(2);
            expect(summary?.totalPlannedWaste).toBe(30);
            expect(summary?.totalActualWaste).toBe(32);
            expect(summary?.avgWastePercentage).toBe(7.5);
            // Variance: ((32-30)/30)*100 = 6.666...
            expect(summary?.wasteVariance).toBeCloseTo(6.666, 2);
            // Grouping by month (both in Jan 2023)
            expect(result.data?.byPeriod).toHaveLength(1);
            expect(result.data?.byPeriod[0].period).toBe('2023-01');
            expect(result.data?.byPeriod[0].count).toBe(2);
        });
    });
    describe('getEfficiencyReport', () => {
        it('should calculate weighted average efficiency', async () => {
            const mockEfficiencyData = [
                {
                    materialTypeId: 'm1',
                    materialTypeName: 'Material 1',
                    materialName: 'Material 1',
                    planCount: 10,
                    avgEfficiency: 90,
                    totalWaste: 100,
                    totalStockUsed: 100
                },
                {
                    materialTypeId: 'm2',
                    materialTypeName: 'Material 2',
                    materialName: 'Material 2',
                    planCount: 5,
                    avgEfficiency: 80,
                    totalWaste: 50,
                    totalStockUsed: 50
                }
            ];
            // Total plans = 15.
            // Weighted avg = (90*10 + 80*5) / 15 = (900 + 400) / 15 = 1300 / 15 = 86.66...
            repository.getEfficiencyData.mockResolvedValue(mockEfficiencyData);
            repository.getTotalPlanCount.mockResolvedValue(15);
            const result = await service.getEfficiencyReport({});
            expect(result.success).toBe(true);
            expect(result.data?.overall.totalPlans).toBe(15);
            expect(result.data?.overall.avgEfficiency).toBeCloseTo(86.66, 1);
            expect(result.data?.byMaterial).toHaveLength(2);
        });
    });
    describe('getCustomerReport', () => {
        it('should return customer report data', async () => {
            const mockData = [
                {
                    customerId: 'c1',
                    customerCode: 'CUST001',
                    customerName: 'Cust 1',
                    orderCount: 5,
                    totalItems: 20,
                    itemCount: 20,
                    completedPlans: 3
                }
            ];
            repository.getCustomerData.mockResolvedValue(mockData);
            const result = await service.getCustomerReport({});
            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].customerName).toBe('Cust 1');
        });
    });
});
//# sourceMappingURL=report.service.spec.js.map