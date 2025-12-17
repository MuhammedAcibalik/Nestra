/**
 * Report Service Handler
 * Exposes report module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
export declare class ReportServiceHandler implements IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getWasteReport;
    private getEfficiencyReport;
    private getCostReport;
}
//# sourceMappingURL=report.service-handler.d.ts.map