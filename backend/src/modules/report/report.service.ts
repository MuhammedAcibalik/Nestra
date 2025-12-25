/**
 * Report Service
 * Following SOLID principles with proper types
 * Core report operations - delegates analytics to specialized service
 */

import {
    IReportService,
    IReportFilter,
    IWasteReportDto,
    IEfficiencyReportDto,
    ICustomerReportDto,
    IMachineReportDto,
    ICostReportDto,
    ICostSummary,
    IMaterialCost,
    IOverallEfficiency,
    IMaterialEfficiency,
    ITrendFilter,
    ITrendReportDto,
    IComparativeFilter,
    IComparativeReportDto,
    IResult,
    success,
    failure
} from '../../core/interfaces';
import { IReportRepository } from './report.repository';
import { calculateWasteSummary, groupWasteByPeriod, getErrorMessage } from './report.mapper';
import { IReportAnalyticsService, ReportAnalyticsService } from './report-analytics.service';

export class ReportService implements IReportService {
    private readonly analyticsService: IReportAnalyticsService;

    constructor(
        private readonly repository: IReportRepository,
        analyticsService?: IReportAnalyticsService
    ) {
        this.analyticsService = analyticsService ?? new ReportAnalyticsService(repository);
    }

    // ==================== CORE REPORTS ====================

    async getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>> {
        try {
            const wasteData = await this.repository.getWasteData(filter);
            const summary = calculateWasteSummary(wasteData);
            const byPeriod = groupWasteByPeriod(wasteData, filter.groupBy ?? 'month');

            return success({ summary, byPeriod });
        } catch (error) {
            return failure({
                code: 'WASTE_REPORT_ERROR',
                message: 'Fire raporu oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>> {
        try {
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const totalPlanCount = await this.repository.getTotalPlanCount(filter);

            const totalEfficiency = efficiencyData.reduce((sum, d) => sum + d.avgEfficiency * d.planCount, 0);
            const weightedAvgEfficiency = totalPlanCount > 0 ? totalEfficiency / totalPlanCount : 0;

            const overall: IOverallEfficiency = {
                totalPlans: totalPlanCount,
                avgEfficiency: weightedAvgEfficiency
            };

            const byMaterial: IMaterialEfficiency[] = efficiencyData.map((d) => ({
                materialTypeId: d.materialTypeId,
                materialName: d.materialName,
                planCount: d.planCount,
                avgEfficiency: d.avgEfficiency,
                totalStockUsed: d.totalStockUsed
            }));

            return success({ overall, byMaterial });
        } catch (error) {
            return failure({
                code: 'EFFICIENCY_REPORT_ERROR',
                message: 'Verimlilik raporu oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>> {
        try {
            const customerData = await this.repository.getCustomerData(filter);

            const dtos: ICustomerReportDto[] = customerData.map((c) => ({
                customerId: c.customerId,
                customerName: c.customerName,
                customerCode: c.customerCode,
                orderCount: c.orderCount,
                itemCount: c.itemCount,
                planCount: 0,
                totalWaste: 0, // Not available in repository
                avgWaste: 0 // Not available in repository
            }));

            return success(dtos);
        } catch (error) {
            return failure({
                code: 'CUSTOMER_REPORT_ERROR',
                message: 'Müşteri raporu oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>> {
        try {
            const machineData = await this.repository.getMachineData(filter);

            const dtos: IMachineReportDto[] = machineData.map((m) => ({
                machineId: m.machineId,
                machineName: m.machineName,
                machineCode: m.machineCode,
                machineType: m.machineType,
                planCount: m.planCount,
                totalProductionTime: m.totalProductionTime,
                avgWastePercentage: m.avgWastePercentage
            }));

            return success(dtos);
        } catch (error) {
            return failure({
                code: 'MACHINE_REPORT_ERROR',
                message: 'Makine raporu oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    async getCostReport(filter: IReportFilter): Promise<IResult<ICostReportDto>> {
        try {
            const efficiencyData = await this.repository.getEfficiencyData(filter);
            const planCount = await this.repository.getTotalPlanCount(filter);

            const totalMaterialCost = efficiencyData.reduce((sum, d) => sum + d.totalStockUsed * 100, 0);
            const totalWasteCost = efficiencyData.reduce((sum, d) => sum + d.totalWaste * 50, 0);

            const summary: ICostSummary = {
                totalMaterialCost,
                totalWasteCost,
                netCost: totalMaterialCost - totalWasteCost,
                planCount,
                avgCostPerPlan: planCount > 0 ? totalMaterialCost / planCount : 0
            };

            const byMaterial: IMaterialCost[] = efficiencyData.map((d) => ({
                materialTypeId: d.materialTypeId,
                materialName: d.materialName,
                unitPrice: 100,
                totalUsed: d.totalStockUsed,
                totalWaste: d.totalWaste,
                materialCost: d.totalStockUsed * 100,
                wasteCost: d.totalWaste * 50,
                stockItemCount: d.totalStockUsed
            }));

            return success({ summary, byMaterial });
        } catch (error) {
            return failure({
                code: 'COST_REPORT_ERROR',
                message: 'Maliyet raporu oluşturulurken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    // ==================== DELEGATED ANALYTICS ====================

    async getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>> {
        return this.analyticsService.getTrendReport(filter);
    }

    async getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>> {
        return this.analyticsService.getComparativeReport(filter);
    }
}
