/**
 * Customer Module - Barrel Export
 */

export {
    CustomerRepository,
    ICustomerRepository,
    CustomerWithRelations,
    ICustomerFilter,
    ICreateCustomerInput,
    IUpdateCustomerInput
} from './customer.repository';
export { CustomerService, ICustomerService, ICustomerDto } from './customer.service';
export { CustomerController } from './customer.controller';

// Microservice
export { CustomerServiceHandler } from './customer.service-handler';
