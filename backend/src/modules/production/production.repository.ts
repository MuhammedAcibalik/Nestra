/**
 * Production Repository
 * Following SRP - Only handles production data access
 */

import { PrismaClient, Prisma, ProductionLog } from '@prisma/client';
import { IProductionLogFilter } from '../../core/interfaces';

export type ProductionLogWithRelations = ProductionLog & {
    cuttingPlan?: {
        id: string;
        planNumber: string;
        scenario?: { name: string };
    };
    operator?: { firstName: string; lastName: string };
    _count?: { stockMovements: number };
};

interface ProductionUpdateInput {
    notes?: string;
    issues?: ProductionIssue[];
}

interface ProductionCompleteInput {
    actualWaste: number;
    actualTime: number;
    notes?: string;
}

interface ProductionIssue {
    description: string;
    severity: string;
}

interface ProductionLogWhereInput {
    status?: string;
    operatorId?: string;
    startedAt?: { gte?: Date; lte?: Date };
}

export interface IProductionRepository {
    findById(id: string): Promise<ProductionLogWithRelations | null>;
    findAll(filter?: IProductionLogFilter): Promise<ProductionLogWithRelations[]>;
    create(planId: string, operatorId: string): Promise<ProductionLog>;
    update(id: string, data: ProductionUpdateInput): Promise<ProductionLog>;
    complete(id: string, data: ProductionCompleteInput): Promise<ProductionLog>;
    findByPlanId(planId: string): Promise<ProductionLog | null>;
}

export class ProductionRepository implements IProductionRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<ProductionLogWithRelations | null> {
        return this.prisma.productionLog.findUnique({
            where: { id },
            include: {
                cuttingPlan: {
                    select: {
                        id: true,
                        planNumber: true,
                        scenario: { select: { name: true } }
                    }
                },
                operator: { select: { firstName: true, lastName: true } },
                _count: { select: { stockMovements: true } }
            }
        });
    }

    async findAll(filter?: IProductionLogFilter): Promise<ProductionLogWithRelations[]> {
        const where: ProductionLogWhereInput = {};

        if (filter?.status) where.status = filter.status;
        if (filter?.operatorId) where.operatorId = filter.operatorId;
        if (filter?.startDate || filter?.endDate) {
            where.startedAt = {};
            if (filter.startDate) where.startedAt.gte = filter.startDate;
            if (filter.endDate) where.startedAt.lte = filter.endDate;
        }

        return this.prisma.productionLog.findMany({
            where: where as Prisma.ProductionLogWhereInput,
            include: {
                cuttingPlan: {
                    select: {
                        id: true,
                        planNumber: true,
                        scenario: { select: { name: true } }
                    }
                },
                operator: { select: { firstName: true, lastName: true } },
                _count: { select: { stockMovements: true } }
            },
            orderBy: { startedAt: 'desc' }
        });
    }

    async create(planId: string, operatorId: string): Promise<ProductionLog> {
        return this.prisma.productionLog.create({
            data: {
                cuttingPlanId: planId,
                operatorId,
                status: 'STARTED',
                startedAt: new Date()
            }
        });
    }

    async update(id: string, data: ProductionUpdateInput): Promise<ProductionLog> {
        return this.prisma.productionLog.update({
            where: { id },
            data: {
                notes: data.notes,
                issues: data.issues as object[] | undefined
            }
        });
    }

    async complete(id: string, data: ProductionCompleteInput): Promise<ProductionLog> {
        return this.prisma.productionLog.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                actualWaste: data.actualWaste,
                actualTime: data.actualTime,
                notes: data.notes,
                completedAt: new Date()
            }
        });
    }

    async findByPlanId(planId: string): Promise<ProductionLog | null> {
        return this.prisma.productionLog.findFirst({
            where: { cuttingPlanId: planId },
            orderBy: { startedAt: 'desc' }
        });
    }
}
