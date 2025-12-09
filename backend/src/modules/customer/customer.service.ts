/**
 * Customer Service
 * Following SOLID principles with proper types
 */

import {
    IResult,
    success,
    failure
} from '../../core/interfaces';
import {
    ICustomerRepository,
    CustomerWithRelations,
    ICustomerFilter,
    ICreateCustomerInput,
    IUpdateCustomerInput
} from './customer.repository';

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

export class CustomerService implements ICustomerService {
    constructor(private readonly repository: ICustomerRepository) { }

    async getCustomers(filter?: ICustomerFilter): Promise<IResult<ICustomerDto[]>> {
        try {
            const customers = await this.repository.findAll(filter);
            const dtos = customers.map((c) => this.toDto(c));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'CUSTOMER_FETCH_ERROR',
                message: 'Müşteriler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getCustomerById(id: string): Promise<IResult<ICustomerDto>> {
        try {
            const customer = await this.repository.findById(id);

            if (!customer) {
                return failure({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }

            return success(this.toDto(customer));
        } catch (error) {
            return failure({
                code: 'CUSTOMER_FETCH_ERROR',
                message: 'Müşteri getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createCustomer(data: ICreateCustomerInput): Promise<IResult<ICustomerDto>> {
        try {
            // Validate required fields
            if (!data.code || !data.name) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Müşteri kodu ve adı zorunludur'
                });
            }

            // Check for duplicate code
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                return failure({
                    code: 'DUPLICATE_CODE',
                    message: 'Bu müşteri kodu zaten kullanılıyor'
                });
            }

            const customer = await this.repository.create(data);
            const fullCustomer = await this.repository.findById(customer.id);

            return success(this.toDto(fullCustomer!));
        } catch (error) {
            return failure({
                code: 'CUSTOMER_CREATE_ERROR',
                message: 'Müşteri oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateCustomer(id: string, data: IUpdateCustomerInput): Promise<IResult<ICustomerDto>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }

            const customer = await this.repository.update(id, data);
            const fullCustomer = await this.repository.findById(customer.id);

            return success(this.toDto(fullCustomer!));
        } catch (error) {
            return failure({
                code: 'CUSTOMER_UPDATE_ERROR',
                message: 'Müşteri güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteCustomer(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'CUSTOMER_NOT_FOUND',
                    message: 'Müşteri bulunamadı'
                });
            }

            // Check if customer has orders
            if (existing._count?.orders && existing._count.orders > 0) {
                return failure({
                    code: 'CUSTOMER_HAS_ORDERS',
                    message: 'Bu müşteriye ait siparişler var, silinemez'
                });
            }

            await this.repository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'CUSTOMER_DELETE_ERROR',
                message: 'Müşteri silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDto(customer: CustomerWithRelations): ICustomerDto {
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

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
