"use strict";
/**
 * Report Analytics Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for trend and comparative report analysis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportAnalyticsService = void 0;
const interfaces_1 = require("../../core/interfaces");
const report_mapper_1 = require("./report.mapper");
/**
 * Report Analytics Service Implementation
 */
class ReportAnalyticsService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getTrendReport(filter) {
        try {
            const reportFilter = {
                startDate: filter.startDate,
                endDate: filter.endDate,
                materialTypeId: filter.materialTypeId,
                machineId: filter.machineId,
                groupBy: filter.groupBy
            };
            const wasteData = await this.repository.getWasteData(reportFilter);
            const dataByPeriod = (0, report_mapper_1.groupDataByPeriod)(wasteData, filter.groupBy, filter.metric);
            const values = dataByPeriod.map((d) => d.value);
            const movingAvg = (0, report_mapper_1.calculateMovingAverage)(values, 3);
            const trend = (0, report_mapper_1.calculateTrendDirection)(dataByPeriod);
            // Create period label
            const period = `${filter.startDate.toISOString().split('T')[0]} - ${filter.endDate.toISOString().split('T')[0]}`;
            return (0, interfaces_1.success)({
                metric: filter.metric,
                period,
                dataPoints: dataByPeriod,
                trendDirection: trend.direction,
                changePercentage: trend.changePercentage,
                movingAverage: movingAvg
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'TREND_REPORT_ERROR',
                message: 'Trend raporu oluşturulurken hata oluştu',
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
            });
        }
    }
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
                    items = data.map((d) => ({
                        id: d.materialTypeId,
                        name: d.materialName,
                        value: filter.metric === 'EFFICIENCY' ? d.avgEfficiency : 100 - d.avgEfficiency,
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
            const average = items.length > 0 ? items.reduce((sum, i) => sum + i.value, 0) / items.length : 0;
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
                ? {
                    id: items[items.length - 1].id,
                    name: items[items.length - 1].name,
                    value: items[items.length - 1].value
                }
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
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
            });
        }
    }
}
exports.ReportAnalyticsService = ReportAnalyticsService;
//# sourceMappingURL=report-analytics.service.js.map