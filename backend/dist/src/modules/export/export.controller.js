"use strict";
/**
 * Export Controller
 * Handles HTTP requests for PDF and Excel export
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const express_1 = require("express");
const export_service_1 = require("./export.service");
class ExportController {
    prisma;
    router;
    constructor(prisma) {
        this.prisma = prisma;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // GET /api/export/plan/:planId/pdf - Export single plan to PDF
        this.router.get('/plan/:planId/pdf', this.exportPlanToPdf.bind(this));
        // GET /api/export/plan/:planId/excel - Export single plan to Excel
        this.router.get('/plan/:planId/excel', this.exportPlanToExcel.bind(this));
        // POST /api/export/plans/excel - Export multiple plans to Excel
        this.router.post('/plans/excel', this.exportMultiplePlansToExcel.bind(this));
    }
    async exportPlanToPdf(req, res) {
        try {
            const { planId } = req.params;
            const includeLayouts = req.query.layouts === 'true';
            const includePieceDetails = req.query.pieces === 'true';
            const language = req.query.lang ?? 'tr';
            const planData = await this.getPlanExportData(planId);
            if (!planData) {
                res.status(404).json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' } });
                return;
            }
            const options = { includeLayouts, includePieceDetails, language };
            const pdfBuffer = await export_service_1.exportService.exportPlanToPdf(planData, options);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${planData.planNumber}.pdf"`);
            res.send(pdfBuffer);
        }
        catch (error) {
            console.error('PDF export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'PDF oluşturulurken hata' } });
        }
    }
    async exportPlanToExcel(req, res) {
        try {
            const { planId } = req.params;
            const includeLayouts = req.query.layouts === 'true';
            const includePieceDetails = req.query.pieces === 'true';
            const language = req.query.lang ?? 'tr';
            const planData = await this.getPlanExportData(planId);
            if (!planData) {
                res.status(404).json({ success: false, error: { code: 'PLAN_NOT_FOUND', message: 'Plan bulunamadı' } });
                return;
            }
            const options = { includeLayouts, includePieceDetails, language };
            const excelBuffer = await export_service_1.exportService.exportPlanToExcel(planData, options);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="plan-${planData.planNumber}.xlsx"`);
            res.send(excelBuffer);
        }
        catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' } });
        }
    }
    async exportMultiplePlansToExcel(req, res) {
        try {
            const { planIds } = req.body;
            const language = req.query.lang ?? 'tr';
            if (!planIds || planIds.length === 0) {
                res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Plan ID listesi gerekli' } });
                return;
            }
            const plans = [];
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
            const options = { language };
            const excelBuffer = await export_service_1.exportService.exportMultiplePlansToExcel(plans, options);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="plans-export.xlsx"');
            res.send(excelBuffer);
        }
        catch (error) {
            console.error('Excel export error:', error);
            res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: 'Excel oluşturulurken hata' } });
        }
    }
    async getPlanExportData(planId) {
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
        if (!plan)
            return null;
        const layouts = plan.stockItems.map((ps) => {
            const stock = ps.stockItem;
            const is2D = stock.stockType === 'SHEET_2D';
            const dimensions = is2D
                ? `${stock.width ?? 0} x ${stock.height ?? 0} mm`
                : `${stock.length ?? 0} mm`;
            // Parse layout data for pieces (simplified)
            const layoutData = ps.layoutData;
            const pieces = (layoutData?.pieces ?? []).map((p) => ({
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
exports.ExportController = ExportController;
//# sourceMappingURL=export.controller.js.map