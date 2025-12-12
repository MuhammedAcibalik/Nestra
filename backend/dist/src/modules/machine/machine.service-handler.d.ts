/**
 * Machine Service Handler
 * Exposes machine module as internal service
 * Following ISP - only exposes operations needed by other modules
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { IMachineRepository } from './machine.repository';
export interface IMachineSummary {
    id: string;
    name: string;
    code: string;
    machineType: string;
    isActive: boolean;
    kerf?: number | null;
}
export declare class MachineServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: IMachineRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getMachineById;
    private getAllMachines;
    private getActiveMachines;
    private toSummary;
}
//# sourceMappingURL=machine.service-handler.d.ts.map