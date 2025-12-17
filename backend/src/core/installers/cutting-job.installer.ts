/**
 * Cutting Job Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { CuttingJobRepository, CuttingJobService, CuttingJobController } from '../../modules/cutting-job';
import { CuttingJobServiceHandler } from '../../modules/cutting-job/cutting-job.service-handler';
import { CuttingJobEventHandler } from '../../modules/cutting-job/cutting-job.event-handler';

export const cuttingJobInstaller: IModuleInstaller = {
    name: 'cutting-job',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        const repository = new CuttingJobRepository(db);

        const serviceHandler = new CuttingJobServiceHandler(repository);
        registry.register('cutting-job', serviceHandler);

        const eventHandler = new CuttingJobEventHandler(repository);
        eventHandler.register();

        const service = new CuttingJobService(repository);
        const controller = new CuttingJobController(service);

        return {
            router: controller.router,
            path: '/api/cutting-jobs',
            middleware: [authMiddleware],
            service
        };
    }
};
