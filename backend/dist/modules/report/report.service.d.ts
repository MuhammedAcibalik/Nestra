/**
 * Report Service
 * Following SOLID principles with proper types
 */
import { IReportService, IReportFilter, IWasteReportDto, IEfficiencyReportDto, ICustomerReportDto, IMachineReportDto, IResult } from '../../core/interfaces';
import { IReportRepository } from './report.repository';
export declare class ReportService implements IReportService {
    private readonly repository;
    constructor(repository: IReportRepository);
    getWasteReport(filter: IReportFilter): Promise<IResult<IWasteReportDto>>;
    getEfficiencyReport(filter: IReportFilter): Promise<IResult<IEfficiencyReportDto>>;
    getCustomerReport(filter: IReportFilter): Promise<IResult<ICustomerReportDto[]>>;
    getMachineReport(filter: IReportFilter): Promise<IResult<IMachineReportDto[]>>;
    private calculateWasteSummary;
    private groupWasteByPeriod;
    private getPeriodKey;
    private getWeekNumber;
    private getErrorMessage;
}
//# sourceMappingURL=report.service.d.ts.map