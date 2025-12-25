/**
 * Production Downtime Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for downtime operations only
 */
import { IResult, IDowntimeLogDto, ICreateDowntimeInput } from '../../core/interfaces';
import { IProductionRepository } from './production.repository';
/**
 * Production Downtime Service Interface
 */
export interface IProductionDowntimeService {
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;
}
/**
 * Production Downtime Service Implementation
 */
export declare class ProductionDowntimeService implements IProductionDowntimeService {
    private readonly repository;
    constructor(repository: IProductionRepository);
    recordDowntime(input: ICreateDowntimeInput): Promise<IResult<IDowntimeLogDto>>;
    endDowntime(downtimeId: string): Promise<IResult<IDowntimeLogDto>>;
    getProductionDowntimes(logId: string): Promise<IResult<IDowntimeLogDto[]>>;
}
//# sourceMappingURL=production-downtime.service.d.ts.map