/**
 * Stock Service Handler
 * Exposes stock module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IStockRepository } from './stock.repository';
export declare class StockServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: IStockRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getAvailableStock;
    private getStockById;
    private createMovement;
    private updateQuantity;
}
//# sourceMappingURL=stock.service-handler.d.ts.map