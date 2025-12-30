/**
 * Time Series Helper Unit Tests
 */

import {
    mean,
    standardDeviation,
    median,
    zScore,
    simpleMovingAverage,
    exponentialMovingAverage,
    simpleExponentialSmoothing,
    doubleExponentialSmoothing,
    detectTrend,
    mape,
    rmse,
    mae,
    getPeriodKey
} from '../infrastructure/time-series.helper';

describe('Time Series Helper', () => {
    describe('Basic Statistics', () => {
        describe('mean', () => {
            it('should calculate mean correctly', () => {
                expect(mean([1, 2, 3, 4, 5])).toBe(3);
                expect(mean([10, 20, 30])).toBe(20);
            });

            it('should return 0 for empty array', () => {
                expect(mean([])).toBe(0);
            });

            it('should handle single value', () => {
                expect(mean([5])).toBe(5);
            });
        });

        describe('standardDeviation', () => {
            it('should calculate standard deviation correctly', () => {
                const values = [2, 4, 4, 4, 5, 5, 7, 9];
                const stdDev = standardDeviation(values);
                expect(stdDev).toBeGreaterThan(1.9);
                expect(stdDev).toBeLessThan(2.1);
            });

            it('should return 0 for less than 2 values', () => {
                expect(standardDeviation([5])).toBe(0);
                expect(standardDeviation([])).toBe(0);
            });
        });

        describe('median', () => {
            it('should calculate median for odd count', () => {
                expect(median([1, 2, 3, 4, 5])).toBe(3);
            });

            it('should calculate median for even count', () => {
                expect(median([1, 2, 3, 4])).toBe(2.5);
            });

            it('should return 0 for empty array', () => {
                expect(median([])).toBe(0);
            });
        });

        describe('zScore', () => {
            it('should calculate z-score correctly', () => {
                expect(zScore(10, 5, 2.5)).toBe(2);
                expect(zScore(0, 5, 2.5)).toBe(-2);
            });

            it('should return 0 for zero stdDev', () => {
                expect(zScore(10, 5, 0)).toBe(0);
            });
        });
    });

    describe('Moving Averages', () => {
        describe('simpleMovingAverage', () => {
            it('should calculate SMA correctly', () => {
                const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                const sma = simpleMovingAverage(values, 3);
                expect(sma[0]).toBe(2);  // (1+2+3)/3
                expect(sma[1]).toBe(3);  // (2+3+4)/3
            });

            it('should return original for window larger than data', () => {
                const values = [1, 2, 3];
                const sma = simpleMovingAverage(values, 5);
                expect(sma).toEqual([1, 2, 3]);
            });
        });

        describe('exponentialMovingAverage', () => {
            it('should calculate EMA correctly', () => {
                const values = [10, 20, 30, 40, 50];
                const ema = exponentialMovingAverage(values, 0.5);
                expect(ema[0]).toBe(10);
                expect(ema[1]).toBe(15);  // 0.5*20 + 0.5*10
            });

            it('should return empty for empty array', () => {
                expect(exponentialMovingAverage([], 0.5)).toEqual([]);
            });
        });
    });

    describe('Exponential Smoothing', () => {
        describe('simpleExponentialSmoothing', () => {
            it('should generate forecasts', () => {
                const values = [10, 12, 14, 16, 18];
                const forecasts = simpleExponentialSmoothing(values, 3, 0.3);
                expect(forecasts.length).toBe(3);
                expect(forecasts[0]).toBeGreaterThan(10);
            });

            it('should return empty for empty input', () => {
                expect(simpleExponentialSmoothing([], 3)).toEqual([]);
            });
        });

        describe('doubleExponentialSmoothing', () => {
            it('should handle trend in data', () => {
                const values = [10, 12, 14, 16, 18, 20];
                const forecasts = doubleExponentialSmoothing(values, 3);
                expect(forecasts.length).toBe(3);
                // Should predict increasing trend
                expect(forecasts[0]).toBeGreaterThan(values[values.length - 1]);
            });

            it('should return values for insufficient data', () => {
                expect(doubleExponentialSmoothing([5], 3)).toEqual([5]);
            });
        });
    });

    describe('Trend Detection', () => {
        it('should detect upward trend', () => {
            const values = [10, 12, 14, 16, 18, 20];
            const { direction, slope } = detectTrend(values);
            expect(direction).toBe('up');
            expect(slope).toBeGreaterThan(0);
        });

        it('should detect downward trend', () => {
            const values = [20, 18, 16, 14, 12, 10];
            const { direction } = detectTrend(values);
            expect(direction).toBe('down');
        });

        it('should detect stable trend', () => {
            const values = [10, 10.1, 9.9, 10, 10.1, 9.9];
            const { direction } = detectTrend(values);
            expect(direction).toBe('stable');
        });
    });

    describe('Accuracy Metrics', () => {
        describe('mape', () => {
            it('should calculate MAPE correctly', () => {
                const actual = [100, 100, 100];
                const predicted = [110, 90, 100];
                const result = mape(actual, predicted);
                // (10/100 + 10/100 + 0/100) / 3 * 100 = 6.67%
                expect(result).toBeCloseTo(6.67, 1);
            });

            it('should return 0 for empty arrays', () => {
                expect(mape([], [])).toBe(0);
            });
        });

        describe('rmse', () => {
            it('should calculate RMSE correctly', () => {
                const actual = [10, 20, 30];
                const predicted = [12, 18, 32];
                const result = rmse(actual, predicted);
                // sqrt((4 + 4 + 4) / 3) = sqrt(4) = 2
                expect(result).toBeCloseTo(2, 1);
            });
        });

        describe('mae', () => {
            it('should calculate MAE correctly', () => {
                const actual = [10, 20, 30];
                const predicted = [12, 18, 32];
                const result = mae(actual, predicted);
                // (2 + 2 + 2) / 3 = 2
                expect(result).toBe(2);
            });
        });
    });

    describe('Date Grouping', () => {
        describe('getPeriodKey', () => {
            it('should format day correctly', () => {
                const date = new Date('2025-12-27');
                expect(getPeriodKey(date, 'day')).toBe('2025-12-27');
            });

            it('should format month correctly', () => {
                const date = new Date('2025-12-27');
                expect(getPeriodKey(date, 'month')).toBe('2025-12');
            });

            it('should format week correctly', () => {
                const date = new Date('2025-12-27');
                const key = getPeriodKey(date, 'week');
                expect(key).toMatch(/2025-W\d{2}/);
            });
        });
    });
});
