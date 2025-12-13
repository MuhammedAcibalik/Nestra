/**
 * Location Service Handler
 * Exposes location module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */
import { IServiceHandler, IServiceRequest, IServiceResponse } from '../../core/services';
import { ILocationRepository } from './location.repository';
export interface ILocationSummary {
    id: string;
    name: string;
    description?: string;
    address?: string;
    stockItemCount: number;
    machineCount: number;
}
export declare class LocationServiceHandler implements IServiceHandler {
    private readonly repository;
    constructor(repository: ILocationRepository);
    handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>>;
    private getLocationById;
    private getLocationByName;
    private getAllLocations;
    private queryLocations;
    private toSummary;
}
//# sourceMappingURL=location.service-handler.d.ts.map