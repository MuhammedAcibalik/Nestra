"use strict";
/**
 * Machine Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.machineInstaller = void 0;
const machine_1 = require("../../modules/machine");
const machine_service_handler_1 = require("../../modules/machine/machine.service-handler");
const machine_event_handler_1 = require("../../modules/machine/machine.event-handler");
exports.machineInstaller = {
    name: 'machine',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new machine_1.MachineRepository(db);
        const serviceHandler = new machine_service_handler_1.MachineServiceHandler(repository);
        registry.register('machine', serviceHandler);
        const eventHandler = new machine_event_handler_1.MachineEventHandler(repository);
        eventHandler.register();
        const service = new machine_1.MachineService(repository);
        const controller = new machine_1.MachineController(service);
        return {
            router: controller.router,
            path: '/api/machines',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=machine.installer.js.map