/**
 * Time Series Helper Utilities
 * Statistical functions for forecasting and anomaly detection
 */

import { ITimeSeriesPoint, IExponentialSmoothingConfig, DEFAULT_SMOOTHING_CONFIG } from '../domain';

// ==================== BASIC STATISTICS ====================

/**
 * Calculate mean of an array
 */
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = mean(values);
    const squaredDiffs = values.map(v => (v - avg) ** 2);
    return Math.sqrt(mean(squaredDiffs));
}

/**
 * Calculate median
 */
export function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate Z-score for a value
 */
export function zScore(value: number, avg: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - avg) / stdDev;
}

// ==================== MOVING AVERAGES ====================

/**
 * Simple Moving Average
 */
export function simpleMovingAverage(values: number[], window: number): number[] {
    if (values.length < window) return [...values];

    const result: number[] = [];
    for (let i = 0; i <= values.length - window; i++) {
        const windowValues = values.slice(i, i + window);
        result.push(mean(windowValues));
    }
    return result;
}

/**
 * Exponential Moving Average
 */
export function exponentialMovingAverage(values: number[], alpha: number): number[] {
    if (values.length === 0) return [];

    const result: number[] = [values[0]];
    for (let i = 1; i < values.length; i++) {
        result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
}

// ==================== EXPONENTIAL SMOOTHING ====================

/**
 * Simple Exponential Smoothing (SES)
 * For data without trend or seasonality
 */
export function simpleExponentialSmoothing(
    values: number[],
    horizon: number,
    alpha: number = DEFAULT_SMOOTHING_CONFIG.alpha
): number[] {
    if (values.length === 0) return [];

    // Calculate smoothed values
    let level = values[0];
    for (let i = 1; i < values.length; i++) {
        level = alpha * values[i] + (1 - alpha) * level;
    }

    // Generate forecasts (constant for SES)
    return Array.from({ length: horizon }, () => level);
}

/**
 * Double Exponential Smoothing (Holt's Method)
 * For data with trend but no seasonality
 */
export function doubleExponentialSmoothing(
    values: number[],
    horizon: number,
    config: IExponentialSmoothingConfig = DEFAULT_SMOOTHING_CONFIG
): number[] {
    if (values.length < 2) return values;

    const { alpha, beta = 0.1 } = config;

    // Initialize
    let level = values[0];
    let trend = values[1] - values[0];

    // Smooth historical data
    for (let i = 1; i < values.length; i++) {
        const prevLevel = level;
        level = alpha * values[i] + (1 - alpha) * (level + trend);
        trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Generate forecasts
    const forecasts: number[] = [];
    for (let h = 1; h <= horizon; h++) {
        forecasts.push(level + h * trend);
    }

    return forecasts;
}

// ==================== CONFIDENCE INTERVALS ====================

/**
 * Calculate prediction intervals for forecasts
 */
export function calculateConfidenceInterval(
    forecasts: number[],
    historicalStdDev: number,
    confidenceLevel: number = 0.95
): { lower: number[]; upper: number[] } {
    // Z-score for confidence level (1.96 for 95%)
    const z = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.9 ? 1.645 : 2.576;

    const lower: number[] = [];
    const upper: number[] = [];

    for (let i = 0; i < forecasts.length; i++) {
        // Widen interval for further forecasts
        const errorMargin = z * historicalStdDev * Math.sqrt(1 + i * 0.1);
        lower.push(Math.max(0, forecasts[i] - errorMargin));
        upper.push(forecasts[i] + errorMargin);
    }

    return { lower, upper };
}

// ==================== TREND DETECTION ====================

/**
 * Detect trend direction from time series
 */
export function detectTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; slope: number } {
    if (values.length < 2) return { direction: 'stable', slope: 0 };

    // Simple linear regression
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = mean(values);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += (i - xMean) ** 2;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const changePercent = yMean !== 0 ? (slope * n / yMean) * 100 : 0;

    // Determine direction based on slope significance
    const direction: 'up' | 'down' | 'stable' =
        Math.abs(changePercent) < 5 ? 'stable' :
            slope > 0 ? 'up' : 'down';

    return { direction, slope };
}

// ==================== ACCURACY METRICS ====================

/**
 * Mean Absolute Percentage Error
 */
export function mape(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    let sum = 0;
    let count = 0;

    for (let i = 0; i < actual.length; i++) {
        if (actual[i] !== 0) {
            sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
            count++;
        }
    }

    return count > 0 ? (sum / count) * 100 : 0;
}

/**
 * Root Mean Square Error
 */
export function rmse(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    const squaredErrors = actual.map((v, i) => (v - predicted[i]) ** 2);
    return Math.sqrt(mean(squaredErrors));
}

/**
 * Mean Absolute Error
 */
export function mae(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) return 0;

    const absoluteErrors = actual.map((v, i) => Math.abs(v - predicted[i]));
    return mean(absoluteErrors);
}

// ==================== DATA GROUPING ====================

/**
 * Group time series data by period
 */
export function groupByPeriod(
    points: ITimeSeriesPoint[],
    period: 'day' | 'week' | 'month'
): Map<string, ITimeSeriesPoint[]> {
    const grouped = new Map<string, ITimeSeriesPoint[]>();

    for (const point of points) {
        const key = getPeriodKey(point.timestamp, period);
        const existing = grouped.get(key) ?? [];
        existing.push(point);
        grouped.set(key, existing);
    }

    return grouped;
}

/**
 * Get period key for grouping
 */
export function getPeriodKey(date: Date, period: 'day' | 'week' | 'month'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (period) {
        case 'day':
            return `${year}-${month}-${day}`;
        case 'week': {
            const weekNum = getWeekNumber(date);
            return `${year}-W${String(weekNum).padStart(2, '0')}`;
        }
        case 'month':
            return `${year}-${month}`;
    }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Generate date range
 */
export function generateDateRange(start: Date, end: Date, period: 'day' | 'week' | 'month'): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
        dates.push(new Date(current));

        switch (period) {
            case 'day':
                current.setDate(current.getDate() + 1);
                break;
            case 'week':
                current.setDate(current.getDate() + 7);
                break;
            case 'month':
                current.setMonth(current.getMonth() + 1);
                break;
        }
    }

    return dates;
}
