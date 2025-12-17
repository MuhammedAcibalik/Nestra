/**
 * Dashboard Service Handler
 * Exposes dashboard module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
export declare class DashboardServiceHandler implements IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getSummary;
    private getStats;
}
//# sourceMappingURL=dashboard.service-handler.d.ts.map