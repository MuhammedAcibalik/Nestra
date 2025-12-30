/**
 * Cutting Job Types
 * Core domain types for Cutting Job module
 */

import { cuttingJobs, cuttingJobItems } from '../../../db/schema';
import { IResult } from '../../../core/interfaces';
import type {
    ICuttingJobDto,
    ICuttingJobWithItemsDto,
    ICuttingJobItemDto,
    ICuttingJobFilter,
    ICreateCuttingJobInput,
    IUpdateCuttingJobInput,
    ICreateCuttingJobItemInput
} from './dto';

/**
 * Cutting job entity type
 */
export type CuttingJob = typeof cuttingJobs.$inferSelect;

/**
 * Cutting job item entity type
 */
export type CuttingJobItem = typeof cuttingJobItems.$inferSelect;

/**
 * Order item info for cutting job
 */
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

/**
 * Cutting job item with relations
 */
export type CuttingJobItemWithRelations = CuttingJobItem & {
    orderItem?: OrderItemForJob;
};

/**
 * Cutting job with relations
 */
export type CuttingJobWithRelations = CuttingJob & {
    items?: CuttingJobItemWithRelations[];
    materialType?: { id: string; name: string };
    _count?: { items: number; scenarios: number };
};

/**
 * Cutting job repository interface
 */
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
    findByMaterialAndThickness(
        materialTypeId: string,
        thickness: number,
        status?: string
    ): Promise<CuttingJobWithRelations[]>;
    getUnassignedOrderItems(confirmedOnly: boolean): Promise<OrderItemForJob[]>;
}

/**
 * Cutting job service interface
 */
export interface ICuttingJobService {
    getCuttingJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>>;
    getCuttingJobById(id: string): Promise<IResult<ICuttingJobWithItemsDto>>;
    createCuttingJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    updateCuttingJob(id: string, data: IUpdateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    deleteCuttingJob(id: string): Promise<IResult<void>>;
    addItemToCuttingJob(jobId: string, data: Omit<ICreateCuttingJobItemInput, 'cuttingJobId'>): Promise<IResult<ICuttingJobItemDto>>;
    removeItemFromCuttingJob(jobId: string, orderItemId: string): Promise<IResult<void>>;
}
