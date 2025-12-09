"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const report_repository_1 = require("../report.repository");
const jest_mock_extended_1 = require("jest-mock-extended");
describe('ReportRepository', () => {
    let repository;
    let prisma;
    let prismaPlan;
    let prismaCustomer;
    beforeEach(() => {
        prisma = (0, jest_mock_extended_1.mock)();
        prismaPlan = (0, jest_mock_extended_1.mock)();
        prismaCustomer = (0, jest_mock_extended_1.mock)();
        prisma.cuttingPlan = prismaPlan;
        prisma.customer = prismaCustomer;
        repository = new report_repository_1.ReportRepository(prisma);
    });
    describe('getWasteData', () => {
        it('should get waste data reports', async () => {
            const mockPlans = [{
                    id: 'plan-1',
                    planNumber: 'PLN-001',
                    totalWaste: 10,
                    wastePercentage: 5,
                    createdAt: new Date(),
                    productionLogs: [{ actualWaste: 12 }]
                }];
            prismaPlan.findMany.mockResolvedValue(mockPlans);
            const result = await repository.getWasteData({});
            expect(result).toHaveLength(1);
            expect(result[0].actualWaste).toBe(12);
            expect(prismaPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'COMPLETED' }),
                include: expect.objectContaining({
                    productionLogs: expect.anything()
                })
            }));
        });
    });
    describe('getEfficiencyData', () => {
        it('should calculate efficiency aggregation', async () => {
            const mockGroup = [{
                    _count: { id: 5 },
                    _avg: { wastePercentage: 10 },
                    _sum: { stockUsedCount: 20 },
                    scenarioId: 'scen-1'
                }];
            prismaPlan.groupBy.mockResolvedValue(mockGroup);
            const result = await repository.getEfficiencyData({});
            expect(result).toHaveLength(1);
            expect(result[0].avgEfficiency).toBe(90); // 100 - 10
            expect(result[0].planCount).toBe(5);
        });
    });
    describe('getCustomerData', () => {
        it('should aggregate customer order stats', async () => {
            const mockCustomers = [{
                    id: 'c1',
                    code: 'C001',
                    name: 'ACME',
                    orders: [
                        { id: 'o1', _count: { items: 5 } },
                        { id: 'o2', _count: { items: 3 } }
                    ]
                }];
            prismaCustomer.findMany.mockResolvedValue(mockCustomers);
            const result = await repository.getCustomerData({});
            expect(result).toHaveLength(1);
            expect(result[0].orderCount).toBe(2);
            expect(result[0].itemCount).toBe(8);
        });
    });
});
//# sourceMappingURL=report.repository.spec.js.map