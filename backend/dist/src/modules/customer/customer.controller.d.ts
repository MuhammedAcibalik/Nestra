/**
 * Customer Controller
 * Following SRP - Only handles HTTP request/response
 */
import { Router } from 'express';
import { ICustomerService } from './customer.service';
export declare class CustomerController {
    private readonly customerService;
    readonly router: Router;
    constructor(customerService: ICustomerService);
    private initializeRoutes;
    private getCustomers;
    private getCustomerById;
    private createCustomer;
    private updateCustomer;
    private deleteCustomer;
}
//# sourceMappingURL=customer.controller.d.ts.map