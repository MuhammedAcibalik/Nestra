/**
 * Forecasting Service Unit Tests
 */

import { ForecastingService, IForecastingService } from '../application/forecasting.service';
import { IAnalyticsRepository } from '../infrastructure/analytics.repository';

describe('ForecastingService', () => {
    let forecastingService: IForecastingService;
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
        forecastingService = new ForecastingService(mockRepository);
    });

    describe('generateForecast', () => {
        it('should return error for insufficient data', async () => {
            mockRepository.getAggregatedMetrics.mockResolvedValue([
                { date: new Date(), value: 10, count: 1 },
                { date: new Date(), value: 12, count: 1 }
            ]);

            const result = await forecastingService.generateForecast({
                metric: 'orders',
                period: 'day',
                horizon: 7
            });

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('INSUFFICIENT_DATA');
        });

        it('should generate forecast with sufficient data', async () => {
            const mockData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (30 - i) * 86400000),
                value: 10 + i,
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await forecastingService.generateForecast({
                metric: 'orders',
                period: 'day',
                horizon: 7
            });

            expect(result.success).toBe(true);
            expect(result.data?.forecast.predictions.length).toBe(7);
            expect(result.data?.forecast.trend).toBe('up');
        });

        it('should include confidence score', async () => {
            const mockData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (30 - i) * 86400000),
                value: 100 + Math.random() * 10,
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await forecastingService.generateForecast({
                metric: 'orders',
                period: 'day',
                horizon: 7
            });

            expect(result.success).toBe(true);
            expect(result.data?.forecast.confidence).toBeGreaterThan(0);
            expect(result.data?.forecast.confidence).toBeLessThanOrEqual(100);
        });
    });

    describe('getOrderForecast', () => {
        it('should call generateForecast with orders metric', async () => {
            const mockData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (30 - i) * 86400000),
                value: 10 + i,
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await forecastingService.getOrderForecast(7, 'day');

            expect(result.success).toBe(true);
            expect(result.data?.forecast.metric).toBe('orders');
        });
    });

    describe('getProductionForecast', () => {
        it('should call generateForecast with production metric', async () => {
            const mockData = Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (30 - i) * 86400000),
                value: 5 + i * 0.5,
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await forecastingService.getProductionForecast(7, 'day');

            expect(result.success).toBe(true);
            expect(result.data?.forecast.metric).toBe('production');
        });
    });
});
