/**
 * Material Service Handler
 * Exposes material module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IMaterialRepository } from './material.repository';
export interface IMaterialTypeSummary {
    id: string;
    name: string;
    description: string | null;
    isRotatable: boolean;
}
export declare class MaterialServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: IMaterialRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getMaterialById;
    private getAllMaterials;
    private getMaterialByName;
    private toSummary;
}
//# sourceMappingURL=material.service-handler.d.ts.map