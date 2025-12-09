/**
 * Production Repository
 * Following SRP - Only handles production data access
 */
import { PrismaClient, ProductionLog } from '@prisma/client';
import { IProductionLogFilter } from '../../core/interfaces';
export type ProductionLogWithRelations = ProductionLog & {
    cuttingPlan?: {
        id: string;
        planNumber: string;
        scenario?: {
            name: string;
        };
    };
    operator?: {
        firstName: string;
        lastName: string;
    };
    _count?: {
        stockMovements: number;
    };
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
export interface IProductionRepository {
    findById(id: string): Promise<ProductionLogWithRelations | null>;
    findAll(filter?: IProductionLogFilter): Promise<ProductionLogWithRelations[]>;
    create(planId: string, operatorId: string): Promise<ProductionLog>;
    update(id: string, data: ProductionUpdateInput): Promise<ProductionLog>;
    complete(id: string, data: ProductionCompleteInput): Promise<ProductionLog>;
    findByPlanId(planId: string): Promise<ProductionLog | null>;
}
export declare class ProductionRepository implements IProductionRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<ProductionLogWithRelations | null>;
    findAll(filter?: IProductionLogFilter): Promise<ProductionLogWithRelations[]>;
    create(planId: string, operatorId: string): Promise<ProductionLog>;
    update(id: string, data: ProductionUpdateInput): Promise<ProductionLog>;
    complete(id: string, data: ProductionCompleteInput): Promise<ProductionLog>;
    findByPlanId(planId: string): Promise<ProductionLog | null>;
}
export {};
//# sourceMappingURL=production.repository.d.ts.map