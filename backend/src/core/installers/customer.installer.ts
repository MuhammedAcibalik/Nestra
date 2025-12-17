/**
 * Customer Module Installer
 */

import { IModuleInstaller, IInstallContext, IModuleResult } from './installer.interface';
import { CustomerRepository, CustomerService, CustomerController } from '../../modules/customer';
import { CustomerServiceHandler } from '../../modules/customer/customer.service-handler';

export const customerInstaller: IModuleInstaller = {
    name: 'customer',

    install(context: IInstallContext): IModuleResult {
        const { db, registry, authMiddleware } = context;

        const repository = new CustomerRepository(db);

        const serviceHandler = new CustomerServiceHandler(repository);
        registry.register('customer', serviceHandler);

        const service = new CustomerService(repository);
        const controller = new CustomerController(service);

        return {
            router: controller.router,
            path: '/api/customers',
            middleware: [authMiddleware],
            service
        };
    }
};
