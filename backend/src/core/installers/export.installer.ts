/**
 * Export Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { ExportRepository, ExportController } from '../../modules/export';

export const exportInstaller: IModuleInstaller = {
    name: 'export',

    install(context: IInstallContext): IModuleResult {
        const { db, authMiddleware } = context;

        const repository = new ExportRepository(db);
        const controller = new ExportController(repository);

        return {
            router: controller.router,
            path: '/api/export',
            middleware: [authMiddleware]
        };
    }
};
