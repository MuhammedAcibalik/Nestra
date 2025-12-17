"use strict";
/**
 * Location Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationInstaller = void 0;
const location_1 = require("../../modules/location");
const location_service_handler_1 = require("../../modules/location/location.service-handler");
exports.locationInstaller = {
    name: 'location',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new location_1.LocationRepository(db);
        const serviceHandler = new location_service_handler_1.LocationServiceHandler(repository);
        registry.register('location', serviceHandler);
        const service = new location_1.LocationService(repository);
        const controller = new location_1.LocationController(service);
        return {
            router: controller.router,
            path: '/api/locations',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=location.installer.js.map