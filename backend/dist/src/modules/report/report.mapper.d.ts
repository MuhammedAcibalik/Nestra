/**
 * Report Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for data transformation and calculation helpers
 */
import { IWasteSummary, IWastePeriod, ITrendDataPoint } from '../../core/interfaces';
import { WasteReportData } from './report.repository';
/**
 * Calculate waste summary from waste data
 */
export declare function calculateWasteSummary(data: WasteReportData[]): IWasteSummary;
/**
 * Group waste data by period (day, week, month)
 */
export declare function groupWasteByPeriod(data: WasteReportData[], groupBy: 'day' | 'week' | 'month'): IWastePeriod[];
/**
 * Get period key for grouping (day, week, month)
 */
export declare function getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string;
/**
 * Get week number for a date
 */
export declare function getWeekNumber(date: Date): number;
/**
 * Calculate trend direction from data points
 */
export declare function calculateTrendDirection(data: ITrendDataPoint[]): {
    direction: 'UP' | 'DOWN' | 'STABLE';
    changePercentage: number;
};
/**
 * Calculate moving average
 */
export declare function calculateMovingAverage(values: number[], period: number): number[];
/**
 * Group data by period for trend analysis
 */
export declare function groupDataByPeriod(data: WasteReportData[], groupBy: 'day' | 'week' | 'month', metric: string): ITrendDataPoint[];
/**
 * Extracts error message from unknown error type
 */
export declare function getErrorMessage(error: unknown): string;
//# sourceMappingURL=report.mapper.d.ts.map