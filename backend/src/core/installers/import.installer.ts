/**
 * Import Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { ImportRepository, ImportService, ImportController } from '../../modules/import';

export const importInstaller: IModuleInstaller = {
    name: 'import',

    install(context: IInstallContext): IModuleResult {
        const { db, authMiddleware } = context;

        const repository = new ImportRepository(db);
        const service = new ImportService(repository);
        const controller = new ImportController(service);

        return {
            router: controller.router,
            path: '/api/import',
            middleware: [authMiddleware],
            service
        };
    }
};
