/**
 * Cutting Job Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { cuttingJobs, cuttingJobItems } from '../../db/schema';
export type CuttingJob = typeof cuttingJobs.$inferSelect;
export type CuttingJobItem = typeof cuttingJobItems.$inferSelect;
export interface OrderItemForJob {
    id: string;
    itemCode: string | null;
    itemName: string | null;
    length: number | null;
    width: number | null;
    height: number | null;
    thickness: number;
    quantity: number;
    geometryType: string;
    materialTypeId: string;
}
export type CuttingJobItemWithRelations = CuttingJobItem & {
    orderItem?: OrderItemForJob;
};
export type CuttingJobWithRelations = CuttingJob & {
    items?: CuttingJobItemWithRelations[];
    materialType?: {
        id: string;
        name: string;
    };
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
    orderItemIds?: string[];
}
export interface IUpdateCuttingJobInput {
    status?: string;
}
export interface ICreateCuttingJobItemInput {
    cuttingJobId: string;
    orderItemId: string;
    quantity: number;
}
export interface ICuttingJobRepository {
    findById(id: string): Promise<CuttingJobWithRelations | null>;
    findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]>;
    create(data: ICreateCuttingJobInput): Promise<CuttingJob>;
    update(id: string, data: IUpdateCuttingJobInput): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getOrderItemsByIds(ids: string[]): Promise<OrderItemForJob[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]>;
}
export declare class CuttingJobRepository implements ICuttingJobRepository {
    private readonly db;
    private jobCounter;
    constructor(db: Database);
    findById(id: string): Promise<CuttingJobWithRelations | null>;
    findAll(filter?: ICuttingJobFilter): Promise<CuttingJobWithRelations[]>;
    create(data: ICreateCuttingJobInput): Promise<CuttingJob>;
    update(id: string, data: IUpdateCuttingJobInput): Promise<CuttingJob>;
    updateStatus(id: string, status: string): Promise<CuttingJob>;
    delete(id: string): Promise<void>;
    addItem(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<CuttingJobItem>;
    removeItem(jobId: string, orderItemId: string): Promise<void>;
    getOrderItemsByIds(ids: string[]): Promise<OrderItemForJob[]>;
    findByMaterialAndThickness(materialTypeId: string, thickness: number, status?: string): Promise<CuttingJobWithRelations[]>;
    getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]>;
}
//# sourceMappingURL=cutting-job.repository.d.ts.map