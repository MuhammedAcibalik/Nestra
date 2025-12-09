/**
 * Location Controller
 * Following SRP - Only handles HTTP request/response
 */

import { Router, Request, Response } from 'express';
import { ILocationService } from './location.service';

export class LocationController {
    public readonly router: Router;

    constructor(private readonly locationService: ILocationService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get('/', this.getLocations.bind(this));
        this.router.get('/:id', this.getLocationById.bind(this));
        this.router.post('/', this.createLocation.bind(this));
        this.router.put('/:id', this.updateLocation.bind(this));
        this.router.delete('/:id', this.deleteLocation.bind(this));
    }

    private async getLocations(req: Request, res: Response): Promise<void> {
        const filter = {
            search: req.query.search as string | undefined
        };

        const result = await this.locationService.getLocations(filter);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }

    private async getLocationById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.locationService.getLocationById(id);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async createLocation(req: Request, res: Response): Promise<void> {
        const result = await this.locationService.createLocation(req.body);

        if (result.success) {
            res.status(201).json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'DUPLICATE_NAME' ? 409 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async updateLocation(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.locationService.updateLocation(id, req.body);

        if (result.success) {
            res.json({ success: true, data: result.data });
        } else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }

    private async deleteLocation(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await this.locationService.deleteLocation(id);

        if (result.success) {
            res.status(204).send();
        } else {
            const status = result.error?.code === 'LOCATION_NOT_FOUND' ? 404 : 400;
            res.status(status).json({ success: false, error: result.error });
        }
    }
}
