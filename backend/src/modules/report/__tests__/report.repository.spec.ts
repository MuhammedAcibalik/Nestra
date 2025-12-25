import { ReportRepository } from '../report.repository';
import { createMockDatabase, MockProxy } from '../../../core/test/db-mock';
import { Database } from '../../../db';

describe('ReportRepository', () => {
    let repository: ReportRepository;
    let db: MockProxy<Database>;

    beforeEach(() => {
        db = createMockDatabase();
        repository = new ReportRepository(db);
    });

    describe('getWasteData', () => {
        it('should get waste data reports', async () => {
            const mockResults = [
                {
                    createdAt: new Date(),
                    totalWaste: 10,
                    wastePercentage: 5
                }
            ];

            (db.select as jest.Mock).mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        orderBy: jest.fn().mockResolvedValue(mockResults)
                    }),
                    orderBy: jest.fn().mockResolvedValue(mockResults)
                })
            });

            const result = await repository.getWasteData({});

            expect(result).toHaveLength(1);
            expect(result[0].wastePercentage).toBe(5);
        });
    });

    describe('getEfficiencyData', () => {
        it('should calculate efficiency aggregation', async () => {
            const mockResults = [
                {
                    planCount: 5,
                    avgWaste: 10,
                    totalWaste: 50,
                    stockUsed: 20
                }
            ];

            (db.select as jest.Mock).mockReturnValue({
                from: jest.fn().mockReturnValue({
                    where: jest.fn().mockResolvedValue(mockResults),
                    orderBy: jest.fn().mockResolvedValue(mockResults)
                })
            });

            const result = await repository.getEfficiencyData({});

            expect(result).toHaveLength(1);
            expect(result[0].avgEfficiency).toBe(90); // 100 - 10
        });
    });

    describe('getCustomerData', () => {
        it('should aggregate customer order stats', async () => {
            const mockResults = [
                {
                    customerId: 'c1',
                    customerName: 'ACME',
                    customerCode: 'C001',
                    orderCount: 2
                }
            ];

            (db.select as jest.Mock).mockReturnValue({
                from: jest.fn().mockReturnValue({
                    leftJoin: jest.fn().mockReturnValue({
                        where: jest.fn().mockReturnValue({
                            groupBy: jest.fn().mockResolvedValue(mockResults)
                        })
                    })
                })
            });

            const result = await repository.getCustomerData({});

            expect(result).toHaveLength(1);
            expect(result[0].orderCount).toBe(2);
            expect(result[0].customerName).toBe('ACME');
        });
    });
});
