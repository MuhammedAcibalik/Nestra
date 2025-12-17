/**
 * Material Module Installer
 * Encapsulates all material module dependencies
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { MaterialRepository, MaterialService, MaterialController } from '../../modules/material';
import { MaterialServiceHandler } from '../../modules/material/material.service-handler';
import { MaterialEventHandler } from '../../modules/material/material.event-handler';

export const materialInstaller: IModuleInstaller = {
    name: 'material',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        // Repository layer
        const repository = new MaterialRepository(db);

        // Service handler for inter-module communication
        const serviceHandler = new MaterialServiceHandler(repository);
        registry.register('material', serviceHandler);

        // Event handler for async events
        const eventHandler = new MaterialEventHandler(repository);
        eventHandler.register();

        // Application service
        const service = new MaterialService(repository);

        // Controller (HTTP layer)
        const controller = new MaterialController(service);

        return {
            router: controller.router,
            path: '/api/materials',
            middleware: [authMiddleware],
            service
        };
    }
};
