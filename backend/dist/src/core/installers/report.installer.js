"use strict";
/**
 * Report Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportInstaller = void 0;
const report_1 = require("../../modules/report");
exports.reportInstaller = {
    name: 'report',
    install(context) {
        const { db, authMiddleware } = context;
        const repository = new report_1.ReportRepository(db);
        const service = new report_1.ReportService(repository);
        const controller = new report_1.ReportController(service);
        return {
            router: controller.router,
            path: '/api/reports',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=report.installer.js.map