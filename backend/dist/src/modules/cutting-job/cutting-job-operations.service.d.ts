/**
 * CuttingJob Operations Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for merge and split operations only
 */
import { IResult } from '../../core/interfaces';
import { ICuttingJobRepository } from './cutting-job.repository';
import { ICuttingJobDto } from './cutting-job.mapper';
/**
 * CuttingJob Operations Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface ICuttingJobOperationsService {
    mergeJobs(sourceJobIds: string[], targetJobId?: string): Promise<IResult<ICuttingJobDto>>;
    splitJob(jobId: string, itemsToSplit: {
        itemId: string;
        quantity: number;
    }[]): Promise<IResult<ICuttingJobDto>>;
}
/**
 * CuttingJob Operations Service Implementation
 */
export declare class CuttingJobOperationsService implements ICuttingJobOperationsService {
    private readonly repository;
    constructor(repository: ICuttingJobRepository);
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
    /**
     * Validate that all jobs have the same material type and thickness
     */
    private validateMaterialAndThickness;
    /**
     * Validate split items exist and quantities are valid
     */
    private validateSplitItems;
    /**
     * Move items from source job to new job
     */
    private moveItemsToNewJob;
}
//# sourceMappingURL=cutting-job-operations.service.d.ts.map