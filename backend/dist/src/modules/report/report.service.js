"use strict";
/**
 * Report Service
 * Following SOLID principles with proper types
 * Core report operations - delegates analytics to specialized service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const interfaces_1 = require("../../core/interfaces");
const report_mapper_1 = require("./report.mapper");
const report_analytics_service_1 = require("./report-analytics.service");
class ReportService {
    repository;
    analyticsService;
    constructor(repository, analyticsService) {
        this.repository = repository;
        this.analyticsService = analyticsService ?? new report_analytics_service_1.ReportAnalyticsService(repository);
    }
    // ==================== CORE REPORTS ====================
    async getWasteReport(filter) {
        try {
            const wasteData = await this.repository.getWasteData(filter);
            const summary = (0, report_mapper_1.calculateWasteSummary)(wasteData);
            const byPeriod = (0, report_mapper_1.groupWasteByPeriod)(wasteData, filter.groupBy ?? 'month');
            return (0, interfaces_1.success)({ summary, byPeriod });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'WASTE_REPORT_ERROR',
                message: 'Fire raporu oluşturulurken hata oluştu',
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
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
            return (0, interfaces_1.success)({ overall, byMaterial });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'EFFICIENCY_REPORT_ERROR',
                message: 'Verimlilik raporu oluşturulurken hata oluştu',
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
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
                planCount: 0,
                totalWaste: 0, // Not available in repository
                avgWaste: 0 // Not available in repository
            }));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_REPORT_ERROR',
                message: 'Müşteri raporu oluşturulurken hata oluştu',
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
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
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    async getCostReport(filter) {
        try {
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const planCount = await this.repository.getTotalPlanCount(filter);
            const totalMaterialCost = efficiencyData.reduce((sum, d) => sum + d.totalStockUsed * 100, 0);
            const totalWasteCost = efficiencyData.reduce((sum, d) => sum + d.totalWaste * 50, 0);
            const summary = {
                totalMaterialCost,
                totalWasteCost,
                netCost: totalMaterialCost - totalWasteCost,
                planCount,
                avgCostPerPlan: planCount > 0 ? totalMaterialCost / planCount : 0
            };
            const byMaterial = efficiencyData.map((d) => ({
                materialTypeId: d.materialTypeId,
                materialName: d.materialName,
                unitPrice: 100,
                totalUsed: d.totalStockUsed,
                totalWaste: d.totalWaste,
                materialCost: d.totalStockUsed * 100,
                wasteCost: d.totalWaste * 50,
                stockItemCount: d.totalStockUsed
            }));
            return (0, interfaces_1.success)({ summary, byMaterial });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COST_REPORT_ERROR',
                message: 'Maliyet raporu oluşturulurken hata oluştu',
                details: { error: (0, report_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    // ==================== DELEGATED ANALYTICS ====================
    async getTrendReport(filter) {
        return this.analyticsService.getTrendReport(filter);
    }
    async getComparativeReport(filter) {
        return this.analyticsService.getComparativeReport(filter);
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=report.service.js.map