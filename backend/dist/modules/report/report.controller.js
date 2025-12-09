"use strict";
/**
 * Report Controller
 * Following SRP - Only handles HTTP concerns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
exports.createReportController = createReportController;
const express_1 = require("express");
class ReportController {
    reportService;
    router;
    constructor(reportService) {
        this.reportService = reportService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get('/waste', this.getWasteReport.bind(this));
        this.router.get('/efficiency', this.getEfficiencyReport.bind(this));
        this.router.get('/customers', this.getCustomerReport.bind(this));
        this.router.get('/machines', this.getMachineReport.bind(this));
    }
    parseFilter(req) {
        return {
            startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
            materialTypeId: req.query.materialTypeId,
            customerId: req.query.customerId,
            machineId: req.query.machineId,
            groupBy: req.query.groupBy ?? 'month'
        };
    }
    async getWasteReport(req, res, next) {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getWasteReport(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getEfficiencyReport(req, res, next) {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getEfficiencyReport(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getCustomerReport(req, res, next) {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getCustomerReport(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
    async getMachineReport(req, res, next) {
        try {
            const filter = this.parseFilter(req);
            const result = await this.reportService.getMachineReport(filter);
            if (result.success) {
                res.json({ success: true, data: result.data });
            }
            else {
                res.status(400).json({ success: false, error: result.error });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ReportController = ReportController;
function createReportController(reportService) {
    return new ReportController(reportService);
}
//# sourceMappingURL=report.controller.js.map