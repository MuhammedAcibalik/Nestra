/**
 * Production Quality Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for quality check operations only
 */
import { IResult, IQualityCheckDto, ICreateQualityCheckInput } from '../../core/interfaces';
import { IProductionRepository } from './production.repository';
/**
 * Production Quality Service Interface
 */
export interface IProductionQualityService {
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
}
/**
 * Production Quality Service Implementation
 */
export declare class ProductionQualityService implements IProductionQualityService {
    private readonly repository;
    constructor(repository: IProductionRepository);
    recordQualityCheck(input: ICreateQualityCheckInput): Promise<IResult<IQualityCheckDto>>;
    getQualityChecks(logId: string): Promise<IResult<IQualityCheckDto[]>>;
}
//# sourceMappingURL=production-quality.service.d.ts.map