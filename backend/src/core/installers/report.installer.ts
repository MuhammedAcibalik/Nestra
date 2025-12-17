/**
 * Report Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { ReportRepository, ReportService, ReportController } from '../../modules/report';

export const reportInstaller: IModuleInstaller = {
    name: 'report',

    install(context: IInstallContext): IModuleResult {
        const { db, authMiddleware } = context;

        const repository = new ReportRepository(db);
        const service = new ReportService(repository);
        const controller = new ReportController(service);

        return {
            router: controller.router,
            path: '/api/reports',
            middleware: [authMiddleware],
            service
        };
    }
};
