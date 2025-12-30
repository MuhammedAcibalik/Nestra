"use strict";
/**
 * Report Mapper
 * Following Single Responsibility Principle (SRP)
 * Responsible for data transformation and calculation helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateWasteSummary = calculateWasteSummary;
exports.groupWasteByPeriod = groupWasteByPeriod;
exports.getPeriodKey = getPeriodKey;
exports.getWeekNumber = getWeekNumber;
exports.calculateTrendDirection = calculateTrendDirection;
exports.calculateMovingAverage = calculateMovingAverage;
exports.groupDataByPeriod = groupDataByPeriod;
exports.getErrorMessage = getErrorMessage;
/**
 * Calculate waste summary from waste data
 */
function calculateWasteSummary(data) {
    if (data.length === 0) {
        return {
            totalPlans: 0,
            totalPlannedWaste: 0,
            totalActualWaste: 0,
            avgWastePercentage: 0,
            wasteVariance: 0
        };
    }
    const totalPlannedWaste = data.reduce((sum, d) => sum + d.plannedWaste, 0);
    const actualWasteData = data.filter((d) => d.actualWaste !== null);
    const totalActualWaste = actualWasteData.reduce((sum, d) => sum + (d.actualWaste ?? 0), 0);
    const avgWastePercentage = data.reduce((sum, d) => sum + d.wastePercentage, 0) / data.length;
    const wasteVariance = actualWasteData.length > 0 ? ((totalActualWaste - totalPlannedWaste) / totalPlannedWaste) * 100 : 0;
    return {
        totalPlans: data.length,
        totalPlannedWaste,
        totalActualWaste,
        avgWastePercentage,
        wasteVariance
    };
}
/**
 * Group waste data by period (day, week, month)
 */
function groupWasteByPeriod(data, groupBy) {
    const groups = new Map();
    for (const item of data) {
        const period = getPeriodKey(item.createdAt, groupBy);
        const existing = groups.get(period) ?? [];
        existing.push(item);
        groups.set(period, existing);
    }
    const periods = [];
    for (const [period, items] of groups) {
        const totalWaste = items.reduce((sum, d) => sum + d.plannedWaste, 0);
        const avgWastePercentage = items.reduce((sum, d) => sum + d.wastePercentage, 0) / items.length;
        periods.push({
            period,
            count: items.length,
            totalWaste,
            avgWastePercentage
        });
    }
    return periods.sort((a, b) => a.period.localeCompare(b.period));
}
/**
 * Get period key for grouping (day, week, month)
 */
function getPeriodKey(date, groupBy) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    switch (groupBy) {
        case 'day':
            return `${year}-${month}-${day}`;
        case 'week': {
            const weekNumber = getWeekNumber(date);
            return `${year}-W${String(weekNumber).padStart(2, '0')}`;
        }
        case 'month':
        default:
            return `${year}-${month}`;
    }
}
/**
 * Get week number for a date
 */
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
/**
 * Calculate trend direction from data points
 */
function calculateTrendDirection(data) {
    if (data.length < 2) {
        return { direction: 'STABLE', changePercentage: 0 };
    }
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    if (firstValue === 0) {
        return { direction: lastValue > 0 ? 'UP' : 'STABLE', changePercentage: 0 };
    }
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
    if (changePercentage > 5) {
        return { direction: 'UP', changePercentage: Math.round(changePercentage * 10) / 10 };
    }
    else if (changePercentage < -5) {
        return { direction: 'DOWN', changePercentage: Math.round(changePercentage * 10) / 10 };
    }
    return { direction: 'STABLE', changePercentage: Math.round(changePercentage * 10) / 10 };
}
/**
 * Calculate moving average
 */
function calculateMovingAverage(values, period) {
    if (values.length < period)
        return values;
    const result = [];
    for (let i = period - 1; i < values.length; i++) {
        const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(Math.round((sum / period) * 100) / 100);
    }
    return result;
}
/**
 * Group data by period for trend analysis
 */
function groupDataByPeriod(data, groupBy, metric) {
    const groups = new Map();
    for (const item of data) {
        const period = getPeriodKey(item.createdAt, groupBy);
        const existing = groups.get(period) ?? [];
        existing.push(item);
        groups.set(period, existing);
    }
    const dataPoints = [];
    for (const [period, items] of groups) {
        let value;
        let count;
        switch (metric) {
            case 'WASTE_PERCENTAGE':
                value = items.reduce((sum, d) => sum + d.wastePercentage, 0) / items.length;
                count = items.length;
                break;
            case 'WASTE_AMOUNT':
                value = items.reduce((sum, d) => sum + d.plannedWaste, 0);
                count = items.length;
                break;
            case 'EFFICIENCY':
                value = 100 - items.reduce((sum, d) => sum + d.wastePercentage, 0) / items.length;
                count = items.length;
                break;
            case 'PLAN_COUNT':
            default:
                value = items.length;
                count = items.length;
                break;
        }
        dataPoints.push({ period, value, count });
    }
    return dataPoints.sort((a, b) => a.period.localeCompare(b.period));
}
/**
 * Extracts error message from unknown error type
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
//# sourceMappingURL=report.mapper.js.map