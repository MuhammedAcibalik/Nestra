/**
 * Report Analytics Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for trend and comparative report analysis
 */
import { IResult, ITrendFilter, ITrendReportDto, IComparativeFilter, IComparativeReportDto } from '../../core/interfaces';
import { IReportRepository } from './report.repository';
/**
 * Report Analytics Service Interface
 */
export interface IReportAnalyticsService {
    getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>>;
    getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>>;
}
/**
 * Report Analytics Service Implementation
 */
export declare class ReportAnalyticsService implements IReportAnalyticsService {
    private readonly repository;
    constructor(repository: IReportRepository);
    getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>>;
    getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>>;
}
//# sourceMappingURL=report-analytics.service.d.ts.map