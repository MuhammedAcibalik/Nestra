/**
 * Report Service
 * Following SOLID principles with proper types
 */
import { IReportService, IReportFilter, IWasteReportDto, IEfficiencyReportDto, ICustomerReportDto, IMachineReportDto, ICostReportDto, ITrendFilter, ITrendReportDto, IComparativeFilter, IComparativeReportDto, IResult } from '../../core/interfaces';
import { IReportRepository } from './report.repository';
export declare class ReportService implements IReportService {
    private readonly repository;
    constructor(repository: IReportRepository);
    getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>>;
    getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>>;
    getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>>;
    getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>>;
    getCostReport(filter: IReportFilter): Promise<IResult<ICostReportDto>>;
    private calculateWasteSummary;
    private groupWasteByPeriod;
    private getPeriodKey;
    private getWeekNumber;
    private getErrorMessage;
    getTrendReport(filter: ITrendFilter): Promise<IResult<ITrendReportDto>>;
    private groupDataByPeriod;
    private calculateTrendDirection;
    private calculateMovingAverage;
    getComparativeReport(filter: IComparativeFilter): Promise<IResult<IComparativeReportDto>>;
}
//# sourceMappingURL=report.service.d.ts.map