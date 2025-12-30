"use strict";
/**
 * Customer Service Handler
 * Exposes customer module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class CustomerServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path } = request;
        // Route: GET /customers/:id
        if (method === 'GET' && /^\/customers\/[\w-]+$/.exec(path)) {
            const customerId = path.split('/')[2];
            return this.getCustomerById(customerId);
        }
        // Route: GET /customers
        if (method === 'GET' && path === '/customers') {
            return this.getAllCustomers();
        }
        // Route: GET /customers/by-code/:code
        if (method === 'GET' && /^\/customers\/by-code\/[\w-]+$/.exec(path)) {
            const code = path.split('/')[3];
            return this.getCustomerByCode(code);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getCustomerById(customerId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getAllCustomers() {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getCustomerByCode(code) {
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
        }
        catch (error) {
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
exports.CustomerServiceHandler = CustomerServiceHandler;
//# sourceMappingURL=customer.service-handler.js.map