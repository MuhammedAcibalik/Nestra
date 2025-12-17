/**
 * Import Service Handler
 * Exposes import module as internal service
 * Following ISP - only exposes needed operations
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
export declare class ImportServiceHandler implements IServiceHandler {
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private validateFile;
    private previewImport;
    private executeImport;
    private getMappingSuggestions;
}
//# sourceMappingURL=import.service-handler.d.ts.map