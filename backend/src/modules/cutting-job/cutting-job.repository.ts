/**
 * CuttingJob Repository
 * Following SRP - Only handles CuttingJob data access
 */

import { PrismaClient, Prisma, CuttingJob, CuttingJobItem } from '@prisma/client';

export type CuttingJobWithRelations = CuttingJob & {
    items?: (CuttingJobItem & {
        orderItem?: {
            id: string;
            itemCode: string | null;
            itemName: string | null;
            geometryType: string;
            length: number | null;
            width: number | null;
            height: number | null;
            quantity: number;
        };
    })[];
    scenarios?: { id: string; name: string; status: string }[];
    _count?: { items: number; scenarios: number };
};

export interface ICuttingJobFilter {
    status?: string;
    materialTypeId?: string;
    thickness?: number;
}

export interface ICreateCuttingJobInput {
    materialTypeId: string;
    thickness: number;
    orderItemIds: string[];
}

export interface IAddJobItemInput {
    orderItemId: string;
    quantity: number;
}

export interface ICuttingJobRepository {
    findById(id: string): Promise<CuttingJobWithRelations | null>;
    findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]>;
    findByJobNumber(jobNumber: string): Promise<CuttingJob | null>;
    create(materialTypeId: string, thickness: number, items?: { orderItemId: string; quantity: number }[]): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: IAddJobItemInput): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getItems(jobId: string): Promise<CuttingJobItem[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    generateJobNumber(): Promise<string>;
}

interface CuttingJobWhereInput {
    status?: string;
    materialTypeId?: string;
    thickness?: number;
}

export class CuttingJobRepository implements ICuttingJobRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<CuttingJobWithRelations | null> {
        return this.prisma.cuttingJob.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                scenarios: {
                    select: { id: true, name: true, status: true }
                },
                _count: { select: { items: true, scenarios: true } }
            }
        });
    }

    async findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]> {
        const where: CuttingJobWhereInput = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.materialTypeId) where.materialTypeId = filter.materialTypeId;
        if (filter?.thickness) where.thickness = filter.thickness;

        return this.prisma.cuttingJob.findMany({
            where: where as Prisma.CuttingJobWhereInput,
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                _count: { select: { items: true, scenarios: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByJobNumber(jobNumber: string): Promise<CuttingJob | null> {
        return this.prisma.cuttingJob.findUnique({ where: { jobNumber } });
    }

    async create(
        materialTypeId: string,
        thickness: number,
        items?: { orderItemId: string; quantity: number }[]
    ): Promise<CuttingJob> {
        const jobNumber = await this.generateJobNumber();

        return this.prisma.cuttingJob.create({
            data: {
                jobNumber,
                materialTypeId,
                thickness,
                status: 'PENDING',
                items: items ? {
                    create: items.map(item => ({
                        orderItemId: item.orderItemId,
                        quantity: item.quantity
                    }))
                } : undefined
            }
        });
    }

    async updateStatus(id: string, status: string): Promise<CuttingJob> {
        return this.prisma.cuttingJob.update({
            where: { id },
            data: {
                status: status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED'
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.cuttingJob.delete({ where: { id } });
    }

    async addItem(jobId: string, data: IAddJobItemInput): Promise<CuttingJobItem> {
        return this.prisma.cuttingJobItem.create({
            data: {
                cuttingJobId: jobId,
                orderItemId: data.orderItemId,
                quantity: data.quantity
            }
        });
    }

    async removeItem(jobId: string, orderItemId: string): Promise<void> {
        await this.prisma.cuttingJobItem.delete({
            where: {
                cuttingJobId_orderItemId: {
                    cuttingJobId: jobId,
                    orderItemId
                }
            }
        });
    }

    async getItems(jobId: string): Promise<CuttingJobItem[]> {
        return this.prisma.cuttingJobItem.findMany({
            where: { cuttingJobId: jobId }
        });
    }

    async findByMaterialAndThickness(
        materialTypeId: string,
        thickness: number,
        status?: string
    ): Promise<CuttingJobWithRelations[]> {
        return this.prisma.cuttingJob.findMany({
            where: {
                materialTypeId,
                thickness,
                ...(status && { status: status as 'PENDING' | 'OPTIMIZING' | 'OPTIMIZED' | 'IN_PRODUCTION' | 'COMPLETED' })
            },
            include: {
                items: {
                    include: {
                        orderItem: {
                            select: {
                                id: true,
                                itemCode: true,
                                itemName: true,
                                geometryType: true,
                                length: true,
                                width: true,
                                height: true,
                                quantity: true
                            }
                        }
                    }
                },
                _count: { select: { items: true, scenarios: true } }
            }
        });
    }

    async generateJobNumber(): Promise<string> {
        const count = await this.prisma.cuttingJob.count();
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `JOB-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    }
}
