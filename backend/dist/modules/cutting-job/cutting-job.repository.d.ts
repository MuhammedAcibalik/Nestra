/**
 * CuttingJob Repository
 * Following SRP - Only handles CuttingJob data access
 */
import { PrismaClient, CuttingJob, CuttingJobItem } from '@prisma/client';
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
    scenarios?: {
        id: string;
        name: string;
        status: string;
    }[];
    _count?: {
        items: number;
        scenarios: number;
    };
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
    create(materialTypeId: string, thickness: number, items?: {
        orderItemId: string;
        quantity: number;
    }[]): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: IAddJobItemInput): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getItems(jobId: string): Promise<CuttingJobItem[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    generateJobNumber(): Promise<string>;
}
export declare class CuttingJobRepository implements ICuttingJobRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<CuttingJobWithRelations | null>;
    findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]>;
    findByJobNumber(jobNumber: string): Promise<CuttingJob | null>;
    create(materialTypeId: string, thickness: number, items?: {
        orderItemId: string;
        quantity: number;
    }[]): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: IAddJobItemInput): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getItems(jobId: string): Promise<CuttingJobItem[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    generateJobNumber(): Promise<string>;
}
//# sourceMappingURL=cutting-job.repository.d.ts.map