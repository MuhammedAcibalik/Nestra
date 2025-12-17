"use strict";
/**
 * Report Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const interfaces_1 = require("../../core/interfaces");
class ReportService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getWasteReport(filter) {
        try {
            const wasteData = await this.repository.getWasteData(filter);
            const summary = this.calculateWasteSummary(wasteData);
            const byPeriod = this.groupWasteByPeriod(wasteData, filter.groupBy ?? 'month');
            return (0, interfaces_1.success)({
                summary,
                byPeriod
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'WASTE_REPORT_ERROR',
                message: 'Fire raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getEfficiencyReport(filter) {
        try {
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const totalPlanCount = await this.repository.getTotalPlanCount(filter);
            const totalEfficiency = efficiencyData.reduce((sum, d) => sum + d.avgEfficiency * d.planCount, 0);
            const weightedAvgEfficiency = totalPlanCount > 0 ? totalEfficiency / totalPlanCount : 0;
            const overall = {
                totalPlans: totalPlanCount,
                avgEfficiency: weightedAvgEfficiency
            };
            const byMaterial = efficiencyData.map((d) => ({
                materialTypeId: d.materialTypeId,
                materialName: d.materialName,
                planCount: d.planCount,
                avgEfficiency: d.avgEfficiency,
                totalStockUsed: d.totalStockUsed
            }));
            return (0, interfaces_1.success)({
                overall,
                byMaterial
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'EFFICIENCY_REPORT_ERROR',
                message: 'Verimlilik raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getCustomerReport(filter) {
        try {
            const customerData = await this.repository.getCustomerData(filter);
            const dtos = customerData.map((c) => ({
                customerId: c.customerId,
                customerName: c.customerName,
                customerCode: c.customerCode,
                orderCount: c.orderCount,
                itemCount: c.itemCount,
                planCount: 0, // Simplified - would require complex nested queries
                totalWaste: 0,
                avgWaste: 0
            }));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_REPORT_ERROR',
                message: 'Müşteri raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getMachineReport(filter) {
        try {
            const machineData = await this.repository.getMachineData(filter);
            const dtos = machineData.map((m) => ({
                machineId: m.machineId,
                machineName: m.machineName,
                machineCode: m.machineCode,
                machineType: m.machineType,
                planCount: m.planCount,
                totalProductionTime: m.totalProductionTime,
                avgWastePercentage: m.avgWastePercentage
            }));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_REPORT_ERROR',
                message: 'Makine raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getCostReport(filter) {
        try {
            // Get efficiency data which includes material and stock info
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const wasteData = await this.repository.getWasteData(filter);
            // Calculate costs per material
            const byMaterial = efficiencyData.map((m) => {
                // Estimate unit price (from stock average or default)
                const unitPrice = 100; // TRY per unit - would come from material/stock data
                const totalUsed = m.totalStockUsed;
                // Get waste for this material from waste data
                const materialWaste = wasteData
                    .filter((w) => w.materialTypeName === m.materialName)
                    .reduce((sum, w) => sum + w.plannedWaste, 0);
                const materialCost = totalUsed * unitPrice;
                const wasteCost = (materialWaste / 100) * materialCost; // waste as % of cost
                return {
                    materialTypeId: m.materialTypeId,
                    materialName: m.materialName,
                    unitPrice,
                    totalUsed,
                    totalWaste: materialWaste,
                    materialCost,
                    wasteCost,
                    stockItemCount: m.planCount // approximate
                };
            });
            // Calculate summary
            const totalMaterialCost = byMaterial.reduce((sum, m) => sum + m.materialCost, 0);
            const totalWasteCost = byMaterial.reduce((sum, m) => sum + m.wasteCost, 0);
            const planCount = efficiencyData.reduce((sum, m) => sum + m.planCount, 0);
            const summary = {
                totalMaterialCost,
                totalWasteCost,
                netCost: totalMaterialCost - totalWasteCost * 0.1, // assume 10% salvageable
                planCount,
                avgCostPerPlan: planCount > 0 ? totalMaterialCost / planCount : 0
            };
            return (0, interfaces_1.success)({ summary, byMaterial });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COST_REPORT_ERROR',
                message: 'Maliyet raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    calculateWasteSummary(data) {
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
        const wasteVariance = actualWasteData.length > 0
            ? ((totalActualWaste - totalPlannedWaste) / totalPlannedWaste) * 100
            : 0;
        return {
            totalPlans: data.length,
            totalPlannedWaste,
            totalActualWaste,
            avgWastePercentage,
            wasteVariance
        };
    }
    groupWasteByPeriod(data, groupBy) {
        const groups = new Map();
        for (const item of data) {
            const period = this.getPeriodKey(item.createdAt, groupBy);
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
    getPeriodKey(date, groupBy) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        switch (groupBy) {
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week': {
                const weekNumber = this.getWeekNumber(date);
                return `${year}-W${String(weekNumber).padStart(2, '0')}`;
            }
            case 'month':
            default:
                return `${year}-${month}`;
        }
    }
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    // ==================== TREND ANALYSIS ====================
    async getTrendReport(filter) {
        try {
            const reportFilter = {
                startDate: filter.startDate,
                endDate: filter.endDate,
                materialTypeId: filter.materialTypeId,
                machineId: filter.machineId,
                groupBy: filter.groupBy
            };
            // Get base data depending on metric
            const wasteData = await this.repository.getWasteData(reportFilter);
            // Group by period
            const dataByPeriod = this.groupDataByPeriod(wasteData, filter.groupBy, filter.metric);
            // Calculate trend direction and change percentage
            const { direction, changePercentage } = this.calculateTrendDirection(dataByPeriod);
            // Calculate moving average (3-period)
            const movingAverage = this.calculateMovingAverage(dataByPeriod.map(d => d.value), 3);
            return (0, interfaces_1.success)({
                metric: filter.metric,
                period: `${filter.startDate.toISOString().slice(0, 10)} - ${filter.endDate.toISOString().slice(0, 10)}`,
                dataPoints: dataByPeriod,
                trendDirection: direction,
                changePercentage,
                movingAverage
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TREND_REPORT_ERROR',
                message: 'Trend raporu oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    groupDataByPeriod(data, groupBy, metric) {
        const groups = new Map();
        for (const item of data) {
            const period = this.getPeriodKey(item.createdAt, groupBy);
            const existing = groups.get(period) ?? { value: 0, count: 0 };
            let metricValue = 0;
            switch (metric) {
                case 'WASTE_PERCENTAGE':
                    metricValue = item.wastePercentage;
                    break;
                case 'EFFICIENCY':
                    metricValue = 100 - item.wastePercentage;
                    break;
                case 'PLAN_COUNT':
                    metricValue = 1;
                    break;
                default:
                    metricValue = item.wastePercentage;
            }
            existing.value += metricValue;
            existing.count += 1;
            groups.set(period, existing);
        }
        const dataPoints = [];
        let previousValue;
        const sortedPeriods = Array.from(groups.keys()).sort();
        for (const period of sortedPeriods) {
            const entry = groups.get(period);
            const avgValue = entry.count > 0 ? entry.value / entry.count : 0;
            dataPoints.push({
                period,
                value: Math.round(avgValue * 100) / 100,
                count: entry.count,
                previousValue,
                changeFromPrevious: previousValue !== undefined
                    ? Math.round((avgValue - previousValue) * 100) / 100
                    : undefined
            });
            previousValue = avgValue;
        }
        return dataPoints;
    }
    calculateTrendDirection(data) {
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
    calculateMovingAverage(values, period) {
        if (values.length < period)
            return values;
        const result = [];
        for (let i = period - 1; i < values.length; i++) {
            const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(Math.round((sum / period) * 100) / 100);
        }
        return result;
    }
    // ==================== COMPARATIVE ANALYSIS ====================
    async getComparativeReport(filter) {
        try {
            const reportFilter = {
                startDate: filter.startDate,
                endDate: filter.endDate
            };
            let items = [];
            switch (filter.compareBy) {
                case 'MATERIAL': {
                    const data = await this.repository.getEfficiencyData(reportFilter);
                    items = data.map((d, index) => ({
                        id: d.materialTypeId,
                        name: d.materialName,
                        value: filter.metric === 'EFFICIENCY' ? d.avgEfficiency : (100 - d.avgEfficiency),
                        count: d.planCount,
                        rank: 0,
                        deviationFromAvg: 0
                    }));
                    break;
                }
                case 'MACHINE': {
                    const data = await this.repository.getMachineData(reportFilter);
                    items = data.map((d) => ({
                        id: d.machineId,
                        name: d.machineName,
                        value: filter.metric === 'WASTE_PERCENTAGE' ? d.avgWastePercentage : d.totalProductionTime,
                        count: d.planCount,
                        rank: 0,
                        deviationFromAvg: 0
                    }));
                    break;
                }
                default: {
                    const wasteData = await this.repository.getWasteData(reportFilter);
                    items = wasteData.map((d, index) => ({
                        id: `period-${index}`,
                        name: d.materialTypeName,
                        value: d.wastePercentage,
                        count: d.planCount,
                        rank: 0,
                        deviationFromAvg: 0
                    }));
                }
            }
            // Calculate average and deviations
            const average = items.length > 0
                ? items.reduce((sum, i) => sum + i.value, 0) / items.length
                : 0;
            // Sort and rank
            items.sort((a, b) => b.value - a.value);
            items.forEach((item, index) => {
                item.rank = index + 1;
                item.deviationFromAvg = Math.round((item.value - average) * 100) / 100;
            });
            const best = items.length > 0
                ? { id: items[0].id, name: items[0].name, value: items[0].value }
                : { id: '', name: '', value: 0 };
            const worst = items.length > 0
                ? { id: items[items.length - 1].id, name: items[items.length - 1].name, value: items[items.length - 1].value }
                : { id: '', name: '', value: 0 };
            return (0, interfaces_1.success)({
                metric: filter.metric,
                compareBy: filter.compareBy,
                items,
                best,
                worst,
                average: Math.round(average * 100) / 100
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COMPARATIVE_REPORT_ERROR',
                message: 'Karşılaştırmalı rapor oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map