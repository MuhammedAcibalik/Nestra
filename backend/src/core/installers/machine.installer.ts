/**
 * Machine Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { MachineRepository, MachineService, MachineController } from '../../modules/machine';
import { MachineServiceHandler } from '../../modules/machine/machine.service-handler';
import { MachineEventHandler } from '../../modules/machine/machine.event-handler';

export const machineInstaller: IModuleInstaller = {
    name: 'machine',

    install(context: IInstallContext): IModuleResult {
        const { prisma, registry, authMiddleware } = context;

        const repository = new MachineRepository(prisma);

        const serviceHandler = new MachineServiceHandler(repository);
        registry.register('machine', serviceHandler);

        const eventHandler = new MachineEventHandler(repository);
        eventHandler.register();

        const service = new MachineService(repository);
        const controller = new MachineController(service);

        return {
            router: controller.router,
            path: '/api/machines',
            middleware: [authMiddleware],
            service
        };
    }
};
