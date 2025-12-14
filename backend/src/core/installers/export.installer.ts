/**
 * Export Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { ExportRepository, ExportController } from '../../modules/export';

export const exportInstaller: IModuleInstaller = {
    name: 'export',

    install(context: IInstallContext): IModuleResult {
        const { prisma, authMiddleware } = context;

        const repository = new ExportRepository(prisma);
        const controller = new ExportController(repository);

        return {
            router: controller.router,
            path: '/api/export',
            middleware: [authMiddleware]
        };
    }
};
