/**
 * Customer Service Handler
 * Exposes customer module as internal service
 * Following ISP - only exposes operations needed by other modules
 */

import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { ICustomerRepository } from './customer.repository';

// ==================== INTERFACES ====================

export interface ICustomerSummary {
    id: string;
    name: string;
    code: string;
    email?: string | null;
    phone?: string | null;
}

// ==================== SERVICE HANDLER ====================

export class CustomerServiceHandler implements IServiceHandler {
    constructor(private readonly repository: ICustomerRepository) {}

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path } = request;

        // Route: GET /customers/:id
        if (method === 'GET' && /^\/customers\/[\w-]+$/.exec(path)) {
            const customerId = path.split('/')[2];
            return this.getCustomerById(customerId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /customers
        if (method === 'GET' && path === '/customers') {
            return this.getAllCustomers() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /customers/by-code/:code
        if (method === 'GET' && /^\/customers\/by-code\/[\w-]+$/.exec(path)) {
            const code = path.split('/')[3];
            return this.getCustomerByCode(code) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getCustomerById(customerId: string): Promise<IServiceResponse<ICustomerSummary>> {
        try {
            const customer = await this.repository.findById(customerId);

            if (!customer) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Customer not found' }
                };
            }

            return {
                success: true,
                data: {
                    id: customer.id,
                    name: customer.name,
                    code: customer.code,
                    email: customer.email,
                    phone: customer.phone
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getAllCustomers(): Promise<IServiceResponse<ICustomerSummary[]>> {
        try {
            const customers = await this.repository.findAll();

            return {
                success: true,
                data: customers.map((c) => ({
                    id: c.id,
                    name: c.name,
                    code: c.code,
                    email: c.email,
                    phone: c.phone
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getCustomerByCode(code: string): Promise<IServiceResponse<ICustomerSummary>> {
        try {
            const customer = await this.repository.findByCode(code);

            if (!customer) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Customer not found' }
                };
            }

            return {
                success: true,
                data: {
                    id: customer.id,
                    name: customer.name,
                    code: customer.code,
                    email: customer.email,
                    phone: customer.phone
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}
