/**
 * Dashboard Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { DashboardRepository, DashboardService, DashboardController } from '../../modules/dashboard';

export const dashboardInstaller: IModuleInstaller = {
    name: 'dashboard',

    install(context: IInstallContext): IModuleResult {
        const { db, authMiddleware } = context;

        const repository = new DashboardRepository(db);
        const service = new DashboardService(repository);
        const controller = new DashboardController(service);

        return {
            router: controller.router,
            path: '/api/dashboard',
            middleware: [authMiddleware],
            service
        };
    }
};
