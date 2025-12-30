/**
 * Location Service
 * Following SOLID principles with proper types
 */
import { IResult } from '../../core/interfaces';
import { ILocationRepository, ILocationFilter, ICreateLocationInput, IUpdateLocationInput, ILocationDto, ILocationService } from './interfaces';
export declare class LocationService implements ILocationService {
    private readonly repository;
    constructor(repository: ILocationRepository);
    getLocations(filter?: ILocationFilter): Promise<IResult<ILocationDto[]>>;
    getLocationById(id: string): Promise<IResult<ILocationDto>>;
    createLocation(data: ICreateLocationInput): Promise<IResult<ILocationDto>>;
    updateLocation(id: string, data: IUpdateLocationInput): Promise<IResult<ILocationDto>>;
    deleteLocation(id: string): Promise<IResult<void>>;
    private toDto;
    private getErrorMessage;
}
export type { ILocationDto, ILocationService } from './interfaces';
//# sourceMappingURL=location.service.d.ts.map