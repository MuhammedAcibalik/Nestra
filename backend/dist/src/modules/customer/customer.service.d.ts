/**
 * Customer Service
 * Following SOLID principles with proper types
 */
import { IResult } from '../../core/interfaces';
import { ICustomerRepository, ICustomerFilter, ICreateCustomerInput, IUpdateCustomerInput } from './customer.repository';
export interface ICustomerDto {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    orderCount: number;
    createdAt: Date;
}
export interface ICustomerService {
    getCustomers(filter?: ICustomerFilter): Promise<IResult<ICustomerDto[]>>;
    getCustomerById(id: string): Promise<IResult<ICustomerDto>>;
    createCustomer(data: ICreateCustomerInput): Promise<IResult<ICustomerDto>>;
    updateCustomer(id: string, data: IUpdateCustomerInput): Promise<IResult<ICustomerDto>>;
    deleteCustomer(id: string): Promise<IResult<void>>;
}
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
//# sourceMappingURL=customer.service.d.ts.map