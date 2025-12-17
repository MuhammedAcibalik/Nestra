/**
 * Location Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { LocationRepository, LocationService, LocationController } from '../../modules/location';
import { LocationServiceHandler } from '../../modules/location/location.service-handler';

export const locationInstaller: IModuleInstaller = {
    name: 'location',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        const repository = new LocationRepository(db);

        const serviceHandler = new LocationServiceHandler(repository);
        registry.register('location', serviceHandler);

        const service = new LocationService(repository);
        const controller = new LocationController(service);

        return {
            router: controller.router,
            path: '/api/locations',
            middleware: [authMiddleware],
            service
        };
    }
};
