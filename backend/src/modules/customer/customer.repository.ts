/**
 * Customer Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { customers } from '../../db/schema';
import { eq, asc, ilike, or } from 'drizzle-orm';

// Type definitions
export type Customer = typeof customers.$inferSelect;

export type CustomerWithRelations = Customer & {
    _count?: { orders: number };
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

export class CustomerRepository implements ICustomerRepository {
    constructor(private readonly db: Database) {}

    async findById(id: string): Promise<Customer | null> {
        const result = await this.db.query.customers.findFirst({
            where: eq(customers.id, id)
        });
        return result ?? null;
    }

    async findByCode(code: string): Promise<Customer | null> {
        const result = await this.db.query.customers.findFirst({
            where: eq(customers.code, code)
        });
        return result ?? null;
    }

    async findAll(filter?: ICustomerFilter): Promise<Customer[]> {
        if (filter?.search) {
            return this.db
                .select()
                .from(customers)
                .where(
                    or(
                        ilike(customers.name, `%${filter.search}%`),
                        ilike(customers.code, `%${filter.search}%`),
                        ilike(customers.email, `%${filter.search}%`)
                    )
                )
                .orderBy(asc(customers.name));
        }

        return this.db.query.customers.findMany({
            orderBy: [asc(customers.name)]
        });
    }

    async create(data: ICreateCustomerInput): Promise<Customer> {
        const [result] = await this.db
            .insert(customers)
            .values({
                code: data.code,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId
            })
            .returning();
        return result;
    }

    async update(id: string, data: IUpdateCustomerInput): Promise<Customer> {
        const [result] = await this.db
            .update(customers)
            .set({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                updatedAt: new Date()
            })
            .where(eq(customers.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(customers).where(eq(customers.id, id));
    }
}
