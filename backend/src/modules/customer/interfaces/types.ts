/**
 * Customer Types
 * Core domain types for Customer module
 */

import { customers } from '../../../db/schema';

/**
 * Customer entity type inferred from Drizzle schema
 */
export type Customer = typeof customers.$inferSelect;

/**
 * Customer with related data
 */
export type CustomerWithRelations = Customer & {
    _count?: { orders: number };
};

/**
 * Customer repository interface
 */
export interface ICustomerRepository {
    findById(id: string): Promise<CustomerWithRelations | null>;
    findByCode(code: string): Promise<Customer | null>;
    findAll(filter?: { search?: string }): Promise<CustomerWithRelations[]>;
    create(data: { code: string; name: string; email?: string; phone?: string; address?: string; taxId?: string }): Promise<Customer>;
    update(id: string, data: { name?: string; email?: string; phone?: string; address?: string; taxId?: string }): Promise<Customer>;
    delete(id: string): Promise<void>;
}

/**
 * Customer service interface
 */
export interface ICustomerService {
    getCustomers(filter?: { search?: string }): Promise<import('../../../core/interfaces').IResult<import('./dto').ICustomerDto[]>>;
    getCustomerById(id: string): Promise<import('../../../core/interfaces').IResult<import('./dto').ICustomerDto>>;
    createCustomer(data: import('./dto').ICreateCustomerInput): Promise<import('../../../core/interfaces').IResult<import('./dto').ICustomerDto>>;
    updateCustomer(id: string, data: import('./dto').IUpdateCustomerInput): Promise<import('../../../core/interfaces').IResult<import('./dto').ICustomerDto>>;
    deleteCustomer(id: string): Promise<import('../../../core/interfaces').IResult<void>>;
}
