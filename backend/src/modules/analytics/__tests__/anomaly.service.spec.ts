/**
 * Anomaly Service Unit Tests
 */

import { AnomalyService, IAnomalyService } from '../application/anomaly.service';
import { IAnalyticsRepository } from '../infrastructure/analytics.repository';

describe('AnomalyService', () => {
    let anomalyService: IAnomalyService;
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
        anomalyService = new AnomalyService(mockRepository);
    });

    describe('detectAnomalies', () => {
        it('should detect spike anomalies', async () => {
            // Normal values with one spike
            const mockData = [
                { date: new Date('2025-12-20'), value: 10, count: 1 },
                { date: new Date('2025-12-21'), value: 11, count: 1 },
                { date: new Date('2025-12-22'), value: 10, count: 1 },
                { date: new Date('2025-12-23'), value: 12, count: 1 },
                { date: new Date('2025-12-24'), value: 11, count: 1 },
                { date: new Date('2025-12-25'), value: 10, count: 1 },
                { date: new Date('2025-12-26'), value: 100, count: 1 }, // Spike!
                { date: new Date('2025-12-27'), value: 11, count: 1 }
            ];
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await anomalyService.detectAnomalies();

            expect(result.success).toBe(true);
            expect(result.data?.anomalies.length).toBeGreaterThan(0);

            const spikeAnomaly = result.data?.anomalies.find(a => a.type === 'spike');
            expect(spikeAnomaly).toBeDefined();
        });

        it('should return detection stats', async () => {
            const mockData = Array.from({ length: 10 }, (_, i) => ({
                date: new Date(Date.now() - (10 - i) * 86400000),
                value: 10 + Math.random() * 2,
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await anomalyService.detectAnomalies();

            expect(result.success).toBe(true);
            expect(result.data?.stats).toBeDefined();
            expect(result.data?.stats.totalChecked).toBeGreaterThan(0);
        });

        it('should not detect anomalies in uniform data', async () => {
            const mockData = Array.from({ length: 10 }, (_, i) => ({
                date: new Date(Date.now() - (10 - i) * 86400000),
                value: 10, // All same value
                count: 1
            }));
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);

            const result = await anomalyService.detectAnomalies();

            expect(result.success).toBe(true);
            expect(result.data?.anomalies.length).toBe(0);
        });
    });

    describe('getRecentAnomalies', () => {
        it('should filter by severity', async () => {
            // First trigger detection
            const mockData = [
                { date: new Date('2025-12-20'), value: 10, count: 1 },
                { date: new Date('2025-12-21'), value: 10, count: 1 },
                { date: new Date('2025-12-22'), value: 10, count: 1 },
                { date: new Date('2025-12-23'), value: 10, count: 1 },
                { date: new Date('2025-12-24'), value: 10, count: 1 },
                { date: new Date('2025-12-25'), value: 10, count: 1 },
                { date: new Date('2025-12-26'), value: 50, count: 1 }, // High severity
                { date: new Date('2025-12-27'), value: 10, count: 1 }
            ];
            mockRepository.getAggregatedMetrics.mockResolvedValue(mockData);
            await anomalyService.detectAnomalies();

            const result = await anomalyService.getRecentAnomalies({ severity: 'high' });

            expect(result.success).toBe(true);
        });

        it('should respect limit', async () => {
            const result = await anomalyService.getRecentAnomalies({ limit: 5 });

            expect(result.success).toBe(true);
            expect(result.data!.length).toBeLessThanOrEqual(5);
        });
    });

    describe('acknowledgeAnomaly', () => {
        it('should return error for non-existent anomaly', async () => {
            const result = await anomalyService.acknowledgeAnomaly('non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
    });

    describe('resolveAnomaly', () => {
        it('should return error for non-existent anomaly', async () => {
            const result = await anomalyService.resolveAnomaly('non-existent-id');

            expect(result.success).toBe(false);
            expect(result.error?.code).toBe('NOT_FOUND');
        });
    });
});
