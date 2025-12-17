"use strict";
/**
 * Dashboard Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardInstaller = void 0;
const dashboard_1 = require("../../modules/dashboard");
exports.dashboardInstaller = {
    name: 'dashboard',
    install(context) {
        const { db, authMiddleware } = context;
        const repository = new dashboard_1.DashboardRepository(db);
        const service = new dashboard_1.DashboardService(repository);
        const controller = new dashboard_1.DashboardController(service);
        return {
            router: controller.router,
            path: '/api/dashboard',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=dashboard.installer.js.map