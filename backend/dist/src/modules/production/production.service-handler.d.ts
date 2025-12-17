/**
 * Production Service Handler
 * Exposes production module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
export declare class ProductionServiceHandler implements IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getLogById;
    private startProduction;
    private getActiveProductions;
}
//# sourceMappingURL=production.service-handler.d.ts.map