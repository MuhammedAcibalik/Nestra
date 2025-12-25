/**
 * CuttingJob Service
 * Following Single Responsibility Principle (SRP)
 * Core CRUD operations only
 * Generator and Operations are delegated to specialized services
 */
import { IResult } from '../../core/interfaces';
import { ICuttingJobRepository, ICreateCuttingJobInput, ICuttingJobFilter } from './cutting-job.repository';
import { ICuttingJobDto, IAutoGenerateResult } from './cutting-job.mapper';
import { ICuttingJobGeneratorService } from './cutting-job-generator.service';
import { ICuttingJobOperationsService } from './cutting-job-operations.service';
export { ICuttingJobDto, ICuttingJobItemDto, IAutoGenerateResult, ISplitJobInput } from './cutting-job.mapper';
/**
 * CuttingJob Service Interface
 */
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
/**
 * CuttingJob Service Implementation
 * Composes generator and operations services
 */
export declare class CuttingJobService implements ICuttingJobService {
    private readonly repository;
    private readonly generatorService;
    private readonly operationsService;
    constructor(repository: ICuttingJobRepository, generatorService?: ICuttingJobGeneratorService, operationsService?: ICuttingJobOperationsService);
    getJobs(filter?: ICuttingJobFilter): Promise<IResult<ICuttingJobDto[]>>;
    getJobById(id: string): Promise<IResult<ICuttingJobDto>>;
    createJob(data: ICreateCuttingJobInput): Promise<IResult<ICuttingJobDto>>;
    updateJobStatus(id: string, status: string): Promise<IResult<ICuttingJobDto>>;
    deleteJob(id: string): Promise<IResult<void>>;
    addItemToJob(jobId: string, orderItemId: string, quantity: number): Promise<IResult<ICuttingJobDto>>;
    removeItemFromJob(jobId: string, orderItemId: string): Promise<IResult<void>>;
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
    mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>>;
    splitJob(jobId: string, itemsToSplit: {
        itemId: string;
        quantity: number;
    }[]): Promise<IResult<ICuttingJobDto>>;
}
//# sourceMappingURL=cutting-job.service.d.ts.map