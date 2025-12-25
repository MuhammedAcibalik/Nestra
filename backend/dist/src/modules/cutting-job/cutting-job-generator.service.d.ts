/**
 * CuttingJob Generator Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for auto-generating cutting jobs from orders
 */
import { IResult } from '../../core/interfaces';
import { ICuttingJobRepository } from './cutting-job.repository';
import { IAutoGenerateResult } from './cutting-job.mapper';
/**
 * CuttingJob Generator Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface ICuttingJobGeneratorService {
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
}
/**
 * CuttingJob Generator Service Implementation
 */
export declare class CuttingJobGeneratorService implements ICuttingJobGeneratorService {
    private readonly repository;
    constructor(repository: ICuttingJobRepository);
    /**
     * Auto-generate cutting jobs from unassigned order items
     * Groups items by material type and thickness
     */
    autoGenerateFromOrders(confirmedOnly?: boolean): Promise<IResult<IAutoGenerateResult>>;
}
//# sourceMappingURL=cutting-job-generator.service.d.ts.map