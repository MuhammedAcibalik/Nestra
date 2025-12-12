/**
 * Customer Service Handler
 * Exposes customer module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { ICustomerRepository } from './customer.repository';
export interface ICustomerSummary {
    id: string;
    name: string;
    code: string;
    email?: string | null;
    phone?: string | null;
}
export declare class CustomerServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: ICustomerRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getCustomerById;
    private getAllCustomers;
    private getCustomerByCode;
}
//# sourceMappingURL=customer.service-handler.d.ts.map