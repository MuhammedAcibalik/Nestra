/**
 * Forecasting Service
 * Time-series forecasting using exponential smoothing
 */

import { v4 as uuidv4 } from 'uuid';
import { IResult, success, failure } from '../../../core/interfaces';
import { createModuleLogger } from '../../../core/logger';
import { getCache } from '../../../core/cache';
import {
    IForecast,
    IForecastRequest,
    IForecastResult,
    ITimeSeriesPoint,
    ForecastPeriod,
    DEFAULT_SMOOTHING_CONFIG
} from '../domain';
import { IAnalyticsRepository, IAnalyticsFilter } from '../infrastructure/analytics.repository';
import {
    doubleExponentialSmoothing,
    calculateConfidenceInterval,
    detectTrend,
    mean,
    standardDeviation,
    mape,
    rmse,
    mae,
    generateDateRange
} from '../infrastructure/time-series.helper';

const logger = createModuleLogger('ForecastingService');
const CACHE_PREFIX = 'forecast';
const CACHE_TTL = 3600; // 1 hour

// ==================== INTERFACE ====================

export interface IForecastingService {
    generateForecast(request: IForecastRequest): Promise<IResult<IForecastResult>>;
    getOrderForecast(horizon: number, period: ForecastPeriod): Promise<IResult<IForecastResult>>;
    getStockForecast(materialTypeId: string, horizon: number): Promise<IResult<IForecastResult>>;
    getProductionForecast(horizon: number, period: ForecastPeriod): Promise<IResult<IForecastResult>>;
    invalidateCache(metric?: string): Promise<void>;
}

// ==================== IMPLEMENTATION ====================

export class ForecastingService implements IForecastingService {
    constructor(private readonly repository: IAnalyticsRepository) { }

    /**
     * Generate forecast for any metric
     */
    async generateForecast(request: IForecastRequest): Promise<IResult<IForecastResult>> {
        try {
            const { metric, period, horizon } = request;

            // Check cache
            const cacheKey = this.buildCacheKey(metric, period, horizon, request.materialTypeId);
            const cached = await this.getFromCache<IForecastResult>(cacheKey);
            if (cached) {
                logger.debug('Forecast cache hit', { metric, period, horizon });
                return success(cached);
            }

            // Get historical data
            const filter: IAnalyticsFilter = {
                startDate: this.getHistoricalStartDate(period),
                endDate: new Date(),
                materialTypeId: request.materialTypeId,
                customerId: request.customerId
            };

            const historicalData = await this.repository.getAggregatedMetrics(metric, filter);

            if (historicalData.length < 7) {
                return failure({
                    code: 'INSUFFICIENT_DATA',
                    message: `Tahmin için yeterli veri yok (minimum 7 veri noktası, mevcut: ${historicalData.length})`
                });
            }

            // Extract values
            const values = historicalData.map(d => d.value);

            // Generate forecasts using double exponential smoothing
            const predictions = doubleExponentialSmoothing(values, horizon, DEFAULT_SMOOTHING_CONFIG);

            // Calculate confidence intervals
            const stdDev = standardDeviation(values);
            const { lower, upper } = calculateConfidenceInterval(predictions, stdDev, 0.95);

            // Detect trend
            const { direction, slope } = detectTrend(values);
            const avgValue = mean(values);
            const changePercentage = avgValue !== 0 ? (slope * horizon / avgValue) * 100 : 0;

            // Build forecast points
            const forecastDates = this.generateForecastDates(period, horizon);
            const forecastPoints = predictions.map((value, i) => ({
                date: forecastDates[i],
                value: Math.max(0, Math.round(value * 100) / 100),
                lowerBound: Math.max(0, Math.round(lower[i] * 100) / 100),
                upperBound: Math.round(upper[i] * 100) / 100
            }));

            // Calculate accuracy (using last 30% as validation)
            const splitPoint = Math.floor(values.length * 0.7);
            const trainData = values.slice(0, splitPoint);
            const testData = values.slice(splitPoint);
            const testPredictions = doubleExponentialSmoothing(trainData, testData.length);

            const accuracy = testData.length > 0 ? {
                mape: Math.round(mape(testData, testPredictions) * 100) / 100,
                rmse: Math.round(rmse(testData, testPredictions) * 100) / 100,
                mae: Math.round(mae(testData, testPredictions) * 100) / 100
            } : undefined;

            // Build forecast result
            const forecast: IForecast = {
                id: uuidv4(),
                metric,
                period,
                horizon,
                predictions: forecastPoints,
                confidence: this.calculateConfidenceScore(accuracy?.mape),
                trend: direction,
                changePercentage: Math.round(changePercentage * 100) / 100,
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + CACHE_TTL * 1000),
                metadata: {
                    algorithm: 'Double Exponential Smoothing (Holt)',
                    dataPoints: values.length,
                    seasonality: false
                }
            };

            const result: IForecastResult = {
                forecast,
                accuracy,
                historicalData: historicalData.map(d => ({
                    timestamp: d.date,
                    value: d.value,
                    label: d.label
                }))
            };

            // Cache result
            await this.setCache(cacheKey, result, CACHE_TTL);

            logger.info('Forecast generated', {
                metric,
                period,
                horizon,
                confidence: forecast.confidence,
                trend: forecast.trend
            });

            return success(result);
        } catch (error) {
            logger.error('Forecast generation failed', { error, request });
            return failure({
                code: 'FORECAST_ERROR',
                message: 'Tahmin oluşturulurken hata oluştu',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            });
        }
    }

    /**
     * Get order forecast
     */
    async getOrderForecast(horizon: number, period: ForecastPeriod): Promise<IResult<IForecastResult>> {
        return this.generateForecast({
            metric: 'orders',
            period,
            horizon
        });
    }

    /**
     * Get stock consumption forecast for a material
     */
    async getStockForecast(materialTypeId: string, horizon: number): Promise<IResult<IForecastResult>> {
        return this.generateForecast({
            metric: 'stock_consumption',
            period: 'day',
            horizon,
            materialTypeId
        });
    }

    /**
     * Get production forecast
     */
    async getProductionForecast(horizon: number, period: ForecastPeriod): Promise<IResult<IForecastResult>> {
        return this.generateForecast({
            metric: 'production',
            period,
            horizon
        });
    }

    /**
     * Invalidate forecast cache
     */
    async invalidateCache(metric?: string): Promise<void> {
        const cache = getCache();
        if (!cache) return;

        // In a full implementation, we'd use pattern-based deletion
        // For now, we just log the invalidation
        logger.info('Cache invalidation requested', { metric: metric ?? 'all' });
    }

    // ==================== PRIVATE METHODS ====================

    private getHistoricalStartDate(period: ForecastPeriod): Date {
        const now = new Date();
        switch (period) {
            case 'day':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days
            case 'week':
                return new Date(now.getTime() - 52 * 7 * 24 * 60 * 60 * 1000); // 52 weeks
            case 'month':
                return new Date(now.getFullYear() - 2, now.getMonth(), 1); // 2 years
        }
    }

    private generateForecastDates(period: ForecastPeriod, horizon: number): Date[] {
        const dates: Date[] = [];
        const now = new Date();

        for (let i = 1; i <= horizon; i++) {
            const date = new Date(now);
            switch (period) {
                case 'day':
                    date.setDate(date.getDate() + i);
                    break;
                case 'week':
                    date.setDate(date.getDate() + i * 7);
                    break;
                case 'month':
                    date.setMonth(date.getMonth() + i);
                    break;
            }
            dates.push(date);
        }

        return dates;
    }

    private calculateConfidenceScore(mapeValue?: number): number {
        if (!mapeValue) return 70; // Default if no accuracy available

        // Convert MAPE to confidence (lower MAPE = higher confidence)
        if (mapeValue <= 10) return 95;
        if (mapeValue <= 20) return 85;
        if (mapeValue <= 30) return 75;
        if (mapeValue <= 50) return 60;
        return 50;
    }

    private buildCacheKey(metric: string, period: string, horizon: number, materialId?: string): string {
        const parts = [CACHE_PREFIX, metric, period, String(horizon)];
        if (materialId) parts.push(materialId);
        return parts.join(':');
    }

    private async getFromCache<T>(key: string): Promise<T | null> {
        const cache = getCache();
        if (!cache) return null;
        return cache.get<T>(key);
    }

    private async setCache<T>(key: string, value: T, ttl: number): Promise<void> {
        const cache = getCache();
        if (!cache) return;
        await cache.set(key, value, ttl);
    }
}
