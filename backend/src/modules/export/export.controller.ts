/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 * Refactored to follow microservice architecture - uses repository injection
 */

import { Router, Request, Response } from 'express';
import { IExportRepository, IExportPlanData } from './export.repository';
import {
    exportService,
    ICuttingPlanExportData,
    ILayoutExportData,
    IExportOptions
} from './export.service';

// ==================== INTERFACES ====================

export interface IExportController {
    readonly router: Router;
}

// ==================== CONTROLLER ====================

export class ExportController implements IExportController {
    public readonly router: Router;

    constructor(private readonly repository: IExportRepository) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // GET /api/export/plan/:planId/pdf - Export single plan to PDF
        this.router.get('/plan/:planId/pdf', this.exportPlanToPdf.bind(this));

        // GET /api/export/plan/:planId/excel - Export single plan to Excel
        this.router.get('/plan/:planId/excel', this.exportPlanToExcel.bind(this));

        // POST /api/export/plans/excel - Export multiple plans to Excel
        this.router.post('/plans/excel', this.exportMultiplePlansToExcel.bind(this));
    }

    private async exportPlanToPdf(req: Request, res: Response): Promise<void> {
        try {
            const { planId } = req.params;
            const includeLayouts = req.query.layouts === 'true';
            const includePieceDetails = req.query.pieces === 'true';
            const language = (req.query.lang as 'tr' | 'en') ?? 'tr';

            const exportData = await this.getPlanExportData(planId);
            if (!exportData) {
                res.status(404).json({
                    success: false,
                    error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' }
                });
                return;
            }

            const options: IExportOptions = { includeLayouts, includePieceDetails, language };
            const pdfBuffer = await exportService.exportPlanToPdf(exportData, options);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${exportData.planNumber}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('PDF export error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'EXPORT_ERROR', message: 'PDF oluşturulurken hata' }
            });
        }
    }

    private async exportPlanToExcel(req: Request, res: Response): Promise<void> {
        try {
            const { planId } = req.params;
            const includeLayouts = req.query.layouts === 'true';
            const includePieceDetails = req.query.pieces === 'true';
            const language = (req.query.lang as 'tr' | 'en') ?? 'tr';

            const exportData = await this.getPlanExportData(planId);
            if (!exportData) {
                res.status(404).json({
                    success: false,
                    error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' }
                });
                return;
            }

            const options: IExportOptions = { includeLayouts, includePieceDetails, language };
            const excelBuffer = await exportService.exportPlanToExcel(exportData, options);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${exportData.planNumber}.xlsx"`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' }
            });
        }
    }

    private async exportMultiplePlansToExcel(req: Request, res: Response): Promise<void> {
        try {
            const { planIds } = req.body as { planIds: string[] };
            const language = (req.query.lang as 'tr' | 'en') ?? 'tr';

            if (!planIds || planIds.length === 0) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Plan ID listesi gerekli' }
                });
                return;
            }

            const plans: ICuttingPlanExportData[] = [];
            for (const planId of planIds) {
                const exportData = await this.getPlanExportData(planId);
                if (exportData) {
                    plans.push(exportData);
                }
            }

            if (plans.length === 0) {
                res.status(404).json({
                    success: false,
                    error: { code: 'NO_PLANS_FOUND', message: 'Geçerli plan bulunamadı' }
                });
                return;
            }

            const options: IExportOptions = { language };
            const excelBuffer = await exportService.exportMultiplePlansToExcel(plans, options);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="plans-export.xlsx"');
            res.send(excelBuffer);
        } catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({
                success: false,
                error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' }
            });
        }
    }

    /**
     * Transform repository data to export format
     */
    private async getPlanExportData(planId: string): Promise<ICuttingPlanExportData | null> {
        const plan = await this.repository.findPlanById(planId);
        if (!plan) return null;

        // Get material type name
        const materialType = await this.repository.findMaterialTypeById(
            plan.scenario.cuttingJob.materialTypeId
        );

        const layouts = this.transformLayouts(plan);

        return {
            planNumber: plan.planNumber,
            scenarioName: plan.scenario.name,
            materialType: materialType?.name ?? 'Bilinmiyor',
            thickness: plan.scenario.cuttingJob.thickness,
            totalWaste: plan.totalWaste,
            wastePercentage: plan.wastePercentage,
            stockUsedCount: plan.stockUsedCount,
            createdAt: plan.createdAt,
            layouts
        };
    }

    /**
     * Transform stock items to layout export format
     */
    private transformLayouts(plan: IExportPlanData): ILayoutExportData[] {
        return plan.stockItems.map(ps => {
            const stock = ps.stockItem;
            const is2D = stock.stockType === 'SHEET_2D';
            const dimensions = is2D
                ? `${stock.width ?? 0} x ${stock.height ?? 0} mm`
                : `${stock.length ?? 0} mm`;

            // Parse layout data for pieces
            const layoutData = ps.layoutData as {
                pieces?: {
                    code?: string;
                    width?: number;
                    height?: number;
                    length?: number;
                    quantity?: number;
                }[];
            } | null;

            const pieces = (layoutData?.pieces ?? []).map(p => ({
                code: p.code,
                dimensions: is2D ? `${p.width ?? 0} x ${p.height ?? 0}` : `${p.length ?? 0}`,
                quantity: p.quantity ?? 1
            }));

            return {
                sequence: ps.sequence,
                stockCode: stock.code,
                stockDimensions: dimensions,
                waste: ps.waste,
                wastePercentage: ps.wastePercentage,
                pieces
            };
        });
    }
}
