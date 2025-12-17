"use strict";
/**
 * Import Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.importInstaller = void 0;
const import_1 = require("../../modules/import");
exports.importInstaller = {
    name: 'import',
    install(context) {
        const { db, authMiddleware } = context;
        const repository = new import_1.ImportRepository(db);
        const service = new import_1.ImportService(repository);
        const controller = new import_1.ImportController(service);
        return {
            router: controller.router,
            path: '/api/import',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=import.installer.js.map