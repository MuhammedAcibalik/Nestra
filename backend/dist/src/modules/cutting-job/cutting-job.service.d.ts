/**
 * CuttingJob Service
 * Following SOLID principles with proper types
 */
import { IResult } from '../../core/interfaces';
import { ICuttingJobRepository, ICuttingJobFilter, ICreateCuttingJobInput } from './cutting-job.repository';
export interface ICuttingJobDto {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: string;
    itemCount: number;
    scenarioCount: number;
    createdAt: Date;
    items?: ICuttingJobItemDto[];
}
export interface ICuttingJobItemDto {
    id: string;
    orderItemId: string;
    itemCode: string | null;
    itemName: string | null;
    geometryType: string;
    dimensions: {
        length?: number | null;
        width?: number | null;
        height?: number | null;
    };
    quantity: number;
}
export interface IAutoGenerateResult {
    createdJobs: ICuttingJobDto[];
    skippedItems: {
        orderItemId: string;
        reason: string;
    }[];
}
export interface ICuttingJobService {
    getJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>>;
    getJobById(id: string): Promise<IResult<ICuttingJobDto>>;
    createJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    updateJobStatus(id: string, status: string): Promise<IResult<ICuttingJobDto>>;
    deleteJob(id: string): Promise<IResult<void>>;
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
    addItemToJob(jobId: string, orderItemId: string, quantity: number): Promise<IResult<ICuttingJobDto>>;
    removeItemFromJob(jobId: string, orderItemId: string): Promise<IResult<void>>;
    mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>>;
    splitJob(jobId: string, itemsToSplit: {
        itemId: string;
        quantity: number;
    }[]): Promise<IResult<ICuttingJobDto>>;
}
/** Input for job split operation */
export interface ISplitJobInput {
    itemId: string;
    quantity: number;
}
export declare class CuttingJobService implements ICuttingJobService {
    private readonly repository;
    constructor(repository: ICuttingJobRepository);
    getJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>>;
    getJobById(id: string): Promise<IResult<ICuttingJobDto>>;
    createJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    updateJobStatus(id: string, status: string): Promise<IResult<ICuttingJobDto>>;
    deleteJob(id: string): Promise<IResult<void>>;
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
    addItemToJob(jobId: string, orderItemId: string, quantity: number): Promise<IResult<ICuttingJobDto>>;
    removeItemFromJob(jobId: string, orderItemId: string): Promise<IResult<void>>;
    private toDto;
    private getErrorMessage;
    /**
     * Merge multiple jobs into one
     * All items from source jobs will be moved to target job
     * Source jobs will be deleted after merge
     */
    mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>>;
    /**
     * Split a job by moving specified items to a new job
     * Returns the newly created job
     */
    splitJob(jobId: string, itemsToSplit: {
        itemId: string;
        quantity: number;
    }[]): Promise<IResult<ICuttingJobDto>>;
}
//# sourceMappingURL=cutting-job.service.d.ts.map