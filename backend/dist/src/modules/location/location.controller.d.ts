/**
 * Location Controller
 * Following SRP - Only handles HTTP request/response
 */
import { Router } from 'express';
import { ILocationService } from './location.service';
export declare class LocationController {
    private readonly locationService;
    readonly router: Router;
    constructor(locationService: ILocationService);
    private initializeRoutes;
    private getLocations;
    private getLocationById;
    private createLocation;
    private updateLocation;
    private deleteLocation;
}
//# sourceMappingURL=location.controller.d.ts.map