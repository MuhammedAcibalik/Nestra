/**
 * Export Service Handler
 * Exposes export module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
export declare class ExportServiceHandler implements IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private generatePdf;
    private generateExcel;
    private generateSvg;
    private generateGcode;
}
//# sourceMappingURL=export.service-handler.d.ts.map