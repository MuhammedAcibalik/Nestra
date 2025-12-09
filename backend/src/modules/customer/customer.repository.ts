/**
 * Customer Repository
 * Following SRP - Only handles Customer data access
 */

import { PrismaClient, Customer } from '@prisma/client';

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

export class CustomerRepository implements ICustomerRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<CustomerWithRelations | null> {
        return this.prisma.customer.findUnique({
            where: { id },
            include: {
                _count: { select: { orders: true } }
            }
        });
    }

    async findByCode(code: string): Promise<Customer | null> {
        return this.prisma.customer.findUnique({ where: { code } });
    }

    async findAll(filter?: ICustomerFilter): Promise<CustomerWithRelations[]> {
        const where = filter?.search
            ? {
                OR: [
                    { code: { contains: filter.search, mode: 'insensitive' as const } },
                    { name: { contains: filter.search, mode: 'insensitive' as const } },
                    { email: { contains: filter.search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        return this.prisma.customer.findMany({
            where,
            include: {
                _count: { select: { orders: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async create(data: ICreateCustomerInput): Promise<Customer> {
        return this.prisma.customer.create({
            data: {
                code: data.code,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                customFields: data.customFields as object | undefined
            }
        });
    }

    async update(id: string, data: IUpdateCustomerInput): Promise<Customer> {
        return this.prisma.customer.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                taxId: data.taxId,
                customFields: data.customFields as object | undefined
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.customer.delete({ where: { id } });
    }
}
