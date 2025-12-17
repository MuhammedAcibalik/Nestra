"use strict";
/**
 * Export Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportInstaller = void 0;
const export_1 = require("../../modules/export");
exports.exportInstaller = {
    name: 'export',
    install(context) {
        const { db, authMiddleware } = context;
        const repository = new export_1.ExportRepository(db);
        const controller = new export_1.ExportController(repository);
        return {
            router: controller.router,
            path: '/api/export',
            middleware: [authMiddleware]
        };
    }
};
//# sourceMappingURL=export.installer.js.map