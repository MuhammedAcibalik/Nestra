/**
 * Customer Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { customers } from '../../db/schema';
export type Customer = typeof customers.$inferSelect;
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
}
export interface IUpdateCustomerInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
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
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<Customer | null>;
    findByCode(code: string): Promise<Customer | null>;
    findAll(filter?: ICustomerFilter): Promise<Customer[]>;
    create(data: ICreateCustomerInput): Promise<Customer>;
    update(id: string, data: IUpdateCustomerInput): Promise<Customer>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=customer.repository.d.ts.map