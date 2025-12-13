/**
 * CuttingJob Service Handler
 * Exposes cutting-job module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { ICuttingJobRepository } from './cutting-job.repository';
export interface ICuttingJobSummary {
    id: string;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: string;
    itemCount: number;
}
export declare class CuttingJobServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: ICuttingJobRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getJobWithItems;
    private getJobById;
    private getAllJobs;
    private getPendingJobs;
    private updateStatus;
    private toSummary;
}
//# sourceMappingURL=cutting-job.service-handler.d.ts.map