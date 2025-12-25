/**
 * Report Service
 * Following SOLID principles with proper types
 * Core report operations - delegates analytics to specialized service
 */
import { IReportService, IReportFilter, IWasteReportDto, IEfficiencyReportDto, ICustomerReportDto, IMachineReportDto, ICostReportDto, ITrendFilter, ITrendReportDto, IComparativeFilter, IComparativeReportDto, IResult } from '../../core/interfaces';
import { IReportRepository } from './report.repository';
import { IReportAnalyticsService } from './report-analytics.service';
export declare class ReportService implements IReportService {
    private readonly repository;
    private readonly analyticsService;
    constructor(repository: IReportRepository, analyticsService?: IReportAnalyticsService);
    getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>>;
    getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>>;
    getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>>;
    getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>>;
    getCostReport(filter: IReportFilter): Promise<IResult<ICostReportDto>>;
    getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>>;
    getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>>;
}
//# sourceMappingURL=report.service.d.ts.map