"use strict";
/**
 * Customer Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const interfaces_1 = require("../../core/interfaces");
class CustomerService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getCustomers(filter) {
        try {
            const customers = await this.repository.findAll(filter);
            const dtos = customers.map((c) => this.toDto(c));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_FETCH_ERROR',
                message: 'Müşteriler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getCustomerById(id) {
        try {
            const customer = await this.repository.findById(id);
            if (!customer) {
                return (0, interfaces_1.failure)({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(customer));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_FETCH_ERROR',
                message: 'Müşteri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createCustomer(data) {
        try {
            // Validate required fields
            if (!data.code || !data.name) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Müşteri kodu ve adı zorunludur'
                });
            }
            // Check for duplicate code
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                return (0, interfaces_1.failure)({
                    code: 'DUPLICATE_CODE',
                    message: 'Bu müşteri kodu zaten kullanılıyor'
                });
            }
            const customer = await this.repository.create(data);
            const fullCustomer = await this.repository.findById(customer.id);
            return (0, interfaces_1.success)(this.toDto(fullCustomer));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_CREATE_ERROR',
                message: 'Müşteri oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateCustomer(id, data) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }
            const customer = await this.repository.update(id, data);
            const fullCustomer = await this.repository.findById(customer.id);
            return (0, interfaces_1.success)(this.toDto(fullCustomer));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_UPDATE_ERROR',
                message: 'Müşteri güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteCustomer(id) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }
            // Check if customer has orders
            if (existing._count?.orders && existing._count.orders > 0) {
                return (0, interfaces_1.failure)({
                    code: 'CUSTOMER_HAS_ORDERS',
                    message: 'Bu müşteriye ait siparişler var, silinemez'
                });
            }
            await this.repository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'CUSTOMER_DELETE_ERROR',
                message: 'Müşteri silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(customer) {
        return {
            id: customer.id,
            code: customer.code,
            name: customer.name,
            email: customer.email ?? undefined,
            phone: customer.phone ?? undefined,
            address: customer.address ?? undefined,
            taxId: customer.taxId ?? undefined,
            orderCount: customer._count?.orders ?? 0,
            createdAt: customer.createdAt
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map