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
}
exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map