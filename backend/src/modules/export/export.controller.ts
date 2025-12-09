/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exportService, ICuttingPlanExportData, ILayoutExportData, IExportOptions } from './export.service';

export class ExportController {
    public readonly router: Router;

    constructor(private readonly prisma: PrismaClient) {
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

            const planData = await this.getPlanExportData(planId);
            if (!planData) {
                res.status(404).json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' } });
                return;
            }

            const options: IExportOptions = { includeLayouts, includePieceDetails, language };
            const pdfBuffer = await exportService.exportPlanToPdf(planData, options);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${planData.planNumber}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('PDF export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'PDF oluşturulurken hata' } });
        }
    }

    private async exportPlanToExcel(req: Request, res: Response): Promise<void> {
        try {
            const { planId } = req.params;
            const includeLayouts = req.query.layouts === 'true';
            const includePieceDetails = req.query.pieces === 'true';
            const language = (req.query.lang as 'tr' | 'en') ?? 'tr';

            const planData = await this.getPlanExportData(planId);
            if (!planData) {
                res.status(404).json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' } });
                return;
            }

            const options: IExportOptions = { includeLayouts, includePieceDetails, language };
            const excelBuffer = await exportService.exportPlanToExcel(planData, options);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${planData.planNumber}.xlsx"`);
            res.send(excelBuffer);
        } catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' } });
        }
    }

    private async exportMultiplePlansToExcel(req: Request, res: Response): Promise<void> {
        try {
            const { planIds } = req.body as { planIds: string[] };
            const language = (req.query.lang as 'tr' | 'en') ?? 'tr';

            if (!planIds || planIds.length === 0) {
                res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Plan ID listesi gerekli' } });
                return;
            }

            const plans: ICuttingPlanExportData[] = [];
            for (const planId of planIds) {
                const planData = await this.getPlanExportData(planId);
                if (planData) {
                    plans.push(planData);
                }
            }

            if (plans.length === 0) {
                res.status(404).json({ success: false, error: { code: 'NO_PLANS_FOUND', message: 'Geçerli plan bulunamadı' } });
                return;
            }

            const options: IExportOptions = { language };
            const excelBuffer = await exportService.exportMultiplePlansToExcel(plans, options);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="plans-export.xlsx"');
            res.send(excelBuffer);
        } catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' } });
        }
    }

    private async getPlanExportData(planId: string): Promise<ICuttingPlanExportData | null> {
        const plan = await this.prisma.cuttingPlan.findUnique({
            where: { id: planId },
            include: {
                scenario: {
                    include: {
                        cuttingJob: {
                            include: {
                                items: {
                                    include: {
                                        orderItem: true
                                    }
                                }
                            }
                        }
                    }
                },
                stockItems: {
                    include: {
                        stockItem: true
                    },
                    orderBy: { sequence: 'asc' }
                }
            }
        });

        if (!plan) return null;

        const layouts: ILayoutExportData[] = plan.stockItems.map((ps) => {
            const stock = ps.stockItem;
            const is2D = stock.stockType === 'SHEET_2D';
            const dimensions = is2D
                ? `${stock.width ?? 0} x ${stock.height ?? 0} mm`
                : `${stock.length ?? 0} mm`;

            // Parse layout data for pieces (simplified)
            const layoutData = ps.layoutData as { pieces?: { code?: string; width?: number; height?: number; length?: number; quantity?: number }[] } | null;
            const pieces = (layoutData?.pieces ?? []).map((p: { code?: string; width?: number; height?: number; length?: number; quantity?: number }) => ({
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

        // Get material type name from the cutting job
        const materialTypeId = plan.scenario.cuttingJob.materialTypeId;
        const materialType = await this.prisma.materialType.findUnique({ where: { id: materialTypeId } });

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
}
