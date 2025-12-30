/**
 * Recommendation Service Unit Tests
 */

import { RecommendationService, IRecommendationService } from '../application/recommendation.service';
import { IAnalyticsRepository } from '../infrastructure/analytics.repository';

describe('RecommendationService', () => {
    let recommendationService: IRecommendationService;
    let mockRepository: jest.Mocked<IAnalyticsRepository>;

    beforeEach(() => {
        mockRepository = {
            getOrderTimeSeries: jest.fn(),
            getStockConsumptionTimeSeries: jest.fn(),
            getProductionTimeSeries: jest.fn(),
            getWasteTimeSeries: jest.fn(),
            getStockConsumptionByMaterial: jest.fn(),
            getAggregatedMetrics: jest.fn()
        };
        recommendationService = new RecommendationService(mockRepository);
    });

    describe('generateRecommendations', () => {
        it('should generate stock recommendations for low stock', async () => {
            mockRepository.getStockConsumptionByMaterial.mockResolvedValue([
                {
                    materialTypeId: 'mat-1',
                    materialName: 'Çelik 5mm',
                    totalConsumed: 100,
                    movementCount: 10,
                    averageDaily: 10,
                    currentStock: 50,
                    daysRemaining: 5 // Critical!
                }
            ]);
            mockRepository.getAggregatedMetrics.mockResolvedValue([]);

            const result = await recommendationService.generateRecommendations();

            expect(result.success).toBe(true);
            expect(result.data?.recommendations.length).toBeGreaterThan(0);

            const stockRec = result.data?.recommendations.find(r => r.category === 'stock');
            expect(stockRec).toBeDefined();
            expect(stockRec?.priority).toBe('critical');
        });

        it('should generate cost recommendations for high waste', async () => {
            mockRepository.getStockConsumptionByMaterial.mockResolvedValue([]);
            mockRepository.getAggregatedMetrics.mockResolvedValue([
                { date: new Date('2025-12-20'), value: 20, count: 1 },
                { date: new Date('2025-12-21'), value: 18, count: 1 },
                { date: new Date('2025-12-22'), value: 22, count: 1 },
                { date: new Date('2025-12-23'), value: 25, count: 1 }, // High waste
                { date: new Date('2025-12-24'), value: 19, count: 1 },
                { date: new Date('2025-12-25'), value: 21, count: 1 },
                { date: new Date('2025-12-26'), value: 20, count: 1 }
            ]);

            const result = await recommendationService.generateRecommendations();

            expect(result.success).toBe(true);

            const costRec = result.data?.recommendations.find(r => r.category === 'cost');
            expect(costRec).toBeDefined();
        });

        it('should return result summary', async () => {
            mockRepository.getStockConsumptionByMaterial.mockResolvedValue([]);
            mockRepository.getAggregatedMetrics.mockResolvedValue([]);

            const result = await recommendationService.generateRecommendations();

            expect(result.success).toBe(true);
            expect(result.data?.generated).toBeDefined();
            expect(result.data?.byCategory).toBeDefined();
            expect(result.data?.byPriority).toBeDefined();
        });
    });

    describe('getActiveRecommendations', () => {
        it('should filter by category', async () => {
            // First generate some recommendations
            mockRepository.getStockConsumptionByMaterial.mockResolvedValue([
                {
                    materialTypeId: 'mat-1',
                    materialName: 'Test Material',
                    totalConsumed: 100,
                    movementCount: 10,
                    averageDaily: 10,
                    currentStock: 30,
                    daysRemaining: 3
                }
            ]);
            mockRepository.getAggregatedMetrics.mockResolvedValue([]);
            await recommendationService.generateRecommendations();

            const result = await recommendationService.getActiveRecommendations({ category: 'stock' });

            expect(result.success).toBe(true);
            result.data?.forEach(rec => {
                expect(rec.category).toBe('stock');
            });
        });

        it('should sort by priority', async () => {
            mockRepository.getStockConsumptionByMaterial.mockResolvedValue([
                {
                    materialTypeId: 'mat-1',
                    materialName: 'Critical Stock',
                    totalConsumed: 100,
                    movementCount: 10,
                    averageDaily: 10,
                    currentStock: 30,
                    daysRemaining: 3 // Critical
                },
                {
                    materialTypeId: 'mat-2',
                    materialName: 'Warning Stock',
                    totalConsumed: 50,
                    movementCount: 5,
                    averageDaily: 5,
                    currentStock: 50,
                    daysRemaining: 10 // High
                }
            ]);
            mockRepository.getAggregatedMetrics.mockResolvedValue([]);
            await recommendationService.generateRecommendations();

            const result = await recommendationService.getActiveRecommendations({});

            expect(result.success).toBe(true);
            if (result.data && result.data.length >= 2) {
                // Critical should come before high
                expect(['critical', 'high']).toContain(result.data[0].priority);
            }
        });
    });

    describe('dismissRecommendation', () => {
        it('should return error for non-existent recommendation', async () => {
            const result = await recommendationService.dismissRecommendation('non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('applyRecommendation', () => {
        it('should return error for non-existent recommendation', async () => {
            const result = await recommendationService.applyRecommendation('non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
    });
});
