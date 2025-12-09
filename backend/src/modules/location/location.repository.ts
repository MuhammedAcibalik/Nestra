/**
 * Location Repository
 * Following SRP - Only handles Location data access
 */

import { PrismaClient, Location } from '@prisma/client';

export type LocationWithRelations = Location & {
    _count?: { stockItems: number; machines: number };
};

export interface ILocationFilter {
    search?: string;
}

export interface ICreateLocationInput {
    name: string;
    description?: string;
    address?: string;
}

export interface IUpdateLocationInput {
    name?: string;
    description?: string;
    address?: string;
}

export interface ILocationRepository {
    findById(id: string): Promise<LocationWithRelations | null>;
    findByName(name: string): Promise<Location | null>;
    findAll(filter?: ILocationFilter): Promise<LocationWithRelations[]>;
    create(data: ICreateLocationInput): Promise<Location>;
    update(id: string, data: IUpdateLocationInput): Promise<Location>;
    delete(id: string): Promise<void>;
}

export class LocationRepository implements ILocationRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<LocationWithRelations | null> {
        return this.prisma.location.findUnique({
            where: { id },
            include: {
                _count: { select: { stockItems: true, machines: true } }
            }
        });
    }

    async findByName(name: string): Promise<Location | null> {
        return this.prisma.location.findUnique({ where: { name } });
    }

    async findAll(filter?: ILocationFilter): Promise<LocationWithRelations[]> {
        const where = filter?.search
            ? {
                OR: [
                    { name: { contains: filter.search, mode: 'insensitive' as const } },
                    { description: { contains: filter.search, mode: 'insensitive' as const } },
                    { address: { contains: filter.search, mode: 'insensitive' as const } }
                ]
            }
            : {};

        return this.prisma.location.findMany({
            where,
            include: {
                _count: { select: { stockItems: true, machines: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async create(data: ICreateLocationInput): Promise<Location> {
        return this.prisma.location.create({
            data: {
                name: data.name,
                description: data.description,
                address: data.address
            }
        });
    }

    async update(id: string, data: IUpdateLocationInput): Promise<Location> {
        return this.prisma.location.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                address: data.address
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.location.delete({ where: { id } });
    }
}
