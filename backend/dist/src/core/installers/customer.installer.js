"use strict";
/**
 * Customer Module Installer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerInstaller = void 0;
const customer_1 = require("../../modules/customer");
const customer_service_handler_1 = require("../../modules/customer/customer.service-handler");
exports.customerInstaller = {
    name: 'customer',
    install(context) {
        const { db, registry, authMiddleware } = context;
        const repository = new customer_1.CustomerRepository(db);
        const serviceHandler = new customer_service_handler_1.CustomerServiceHandler(repository);
        registry.register('customer', serviceHandler);
        const service = new customer_1.CustomerService(repository);
        const controller = new customer_1.CustomerController(service);
        return {
            router: controller.router,
            path: '/api/customers',
            middleware: [authMiddleware],
            service
        };
    }
};
//# sourceMappingURL=customer.installer.js.map