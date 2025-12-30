/**
 * Forecast Domain Models
 * Core types for time-series forecasting
 */

// ==================== FORECAST TYPES ====================

export type ForecastPeriod = 'day' | 'week' | 'month';
export type ForecastMetric = 'orders' | 'stock_consumption' | 'production' | 'waste' | 'efficiency';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface IForecastPoint {
    date: Date;
    value: number;
    lowerBound: number;
    upperBound: number;
}

export interface IForecast {
    id: string;
    metric: ForecastMetric;
    period: ForecastPeriod;
    horizon: number;
    predictions: IForecastPoint[];
    confidence: number; // 0-100
    trend: TrendDirection;
    changePercentage: number;
    generatedAt: Date;
    validUntil: Date;
    metadata?: {
        algorithm: string;
        dataPoints: number;
        seasonality?: boolean;
    };
}

export interface IForecastRequest {
    metric: ForecastMetric;
    period: ForecastPeriod;
    horizon: number;
    materialTypeId?: string;
    customerId?: string;
    includeConfidenceInterval?: boolean;
}

// ==================== TIME SERIES DATA ====================

export interface ITimeSeriesPoint {
    timestamp: Date;
    value: number;
    label?: string;
}

export interface ITimeSeries {
    metric: string;
    points: ITimeSeriesPoint[];
    startDate: Date;
    endDate: Date;
    resolution: ForecastPeriod;
}

// ==================== EXPONENTIAL SMOOTHING CONFIG ====================

export interface IExponentialSmoothingConfig {
    alpha: number;      // Level smoothing (0-1)
    beta?: number;      // Trend smoothing (0-1)
    gamma?: number;     // Seasonal smoothing (0-1)
    seasonalPeriod?: number;
}

export const DEFAULT_SMOOTHING_CONFIG: IExponentialSmoothingConfig = {
    alpha: 0.3,
    beta: 0.1
};

// ==================== FORECAST RESULT ====================

export interface IForecastResult {
    forecast: IForecast;
    accuracy?: {
        mape: number;     // Mean Absolute Percentage Error
        rmse: number;     // Root Mean Square Error
        mae: number;      // Mean Absolute Error
    };
    historicalData: ITimeSeriesPoint[];
}
