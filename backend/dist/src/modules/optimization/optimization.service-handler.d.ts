/**
 * Optimization Service Handler
 * Exposes optimization module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IOptimizationRepository } from './optimization.repository';
export declare class OptimizationServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: IOptimizationRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getPlanById;
    private getPlanStockItems;
    private updatePlanStatus;
}
//# sourceMappingURL=optimization.service-handler.d.ts.map