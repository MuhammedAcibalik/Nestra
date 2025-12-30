/**
 * Customer Service
 * Following SOLID principles with proper types
 */
import { IResult } from '../../core/interfaces';
import { ICustomerRepository, ICustomerFilter, ICreateCustomerInput, IUpdateCustomerInput, ICustomerDto, ICustomerService } from './interfaces';
export declare class CustomerService implements ICustomerService {
    private readonly repository;
    constructor(repository: ICustomerRepository);
    getCustomers(filter?: ICustomerFilter): Promise<IResult<ICustomerDto[]>>;
    getCustomerById(id: string): Promise<IResult<ICustomerDto>>;
    createCustomer(data: ICreateCustomerInput): Promise<IResult<ICustomerDto>>;
    updateCustomer(id: string, data: IUpdateCustomerInput): Promise<IResult<ICustomerDto>>;
    deleteCustomer(id: string): Promise<IResult<void>>;
    private toDto;
    private getErrorMessage;
}
export type { ICustomerDto, ICustomerService } from './interfaces';
//# sourceMappingURL=customer.service.d.ts.map