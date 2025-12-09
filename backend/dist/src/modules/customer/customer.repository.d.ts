/**
 * Customer Repository
 * Following SRP - Only handles Customer data access
 */
import { PrismaClient, Customer } from '@prisma/client';
export type CustomerWithRelations = Customer & {
    _count?: {
        orders: number;
    };
};
export interface ICustomerFilter {
    search?: string;
}
export interface ICreateCustomerInput {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    customFields?: Record<string, unknown>;
}
export interface IUpdateCustomerInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    customFields?: Record<string, unknown>;
}
export interface ICustomerRepository {
    findById(id: string): Promise<CustomerWithRelations | null>;
    findByCode(code: string): Promise<Customer | null>;
    findAll(filter?: ICustomerFilter): Promise<CustomerWithRelations[]>;
    create(data: ICreateCustomerInput): Promise<Customer>;
    update(id: string, data: IUpdateCustomerInput): Promise<Customer>;
    delete(id: string): Promise<void>;
}
export declare class CustomerRepository implements ICustomerRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<CustomerWithRelations | null>;
    findByCode(code: string): Promise<Customer | null>;
    findAll(filter?: ICustomerFilter): Promise<CustomerWithRelations[]>;
    create(data: ICreateCustomerInput): Promise<Customer>;
    update(id: string, data: IUpdateCustomerInput): Promise<Customer>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=customer.repository.d.ts.map