/**
 * Location Service Handler
 * Exposes location module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */

import {
    IServiceHandler,
    IServiceRequest,
    IServiceResponse
} from '../../core/services';
import { ILocationRepository, LocationWithRelations } from './location.repository';

// ==================== INTERFACES ====================

export interface ILocationSummary {
    id: string;
    name: string;
    description?: string;
    address?: string;
    stockItemCount: number;
    machineCount: number;
}

// ==================== SERVICE HANDLER ====================

export class LocationServiceHandler implements IServiceHandler {
    constructor(private readonly repository: ILocationRepository) { }

    async handle<TReq, TRes>(request: IServiceRequest<TReq>): Promise<IServiceResponse<TRes>> {
        const { method, path, data } = request;

        // Route: GET /locations/:id
        if (method === 'GET' && /^\/locations\/[\w-]+$/.exec(path)) {
            const locationId = path.split('/')[2];
            return this.getLocationById(locationId) as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /locations
        if (method === 'GET' && path === '/locations') {
            return this.getAllLocations() as Promise<IServiceResponse<TRes>>;
        }

        // Route: GET /locations/name/:name
        if (method === 'GET' && /^\/locations\/name\/.+$/.exec(path)) {
            const name = decodeURIComponent(path.split('/')[3]);
            return this.getLocationByName(name) as Promise<IServiceResponse<TRes>>;
        }

        // Route: POST /locations/query
        if (method === 'POST' && path === '/locations/query') {
            const filter = data as { search?: string };
            return this.queryLocations(filter) as Promise<IServiceResponse<TRes>>;
        }

        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }

    private async getLocationById(locationId: string): Promise<IServiceResponse<ILocationSummary>> {
        try {
            const location = await this.repository.findById(locationId);

            if (!location) {
                return {
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Location not found' }
                };
            }

            return {
                success: true,
                data: this.toSummary(location)
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getLocationByName(name: string): Promise<IServiceResponse<ILocationSummary | null>> {
        try {
            const location = await this.repository.findByName(name);

            if (!location) {
                return {
                    success: true,
                    data: null
                };
            }

            // findByName returns Location without _count, need full fetch
            const fullLocation = await this.repository.findById(location.id);

            return {
                success: true,
                data: fullLocation ? this.toSummary(fullLocation) : null
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async getAllLocations(): Promise<IServiceResponse<ILocationSummary[]>> {
        try {
            const locations = await this.repository.findAll();

            return {
                success: true,
                data: locations.map(l => this.toSummary(l))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async queryLocations(filter: { search?: string }): Promise<IServiceResponse<ILocationSummary[]>> {
        try {
            const locations = await this.repository.findAll(filter);

            return {
                success: true,
                data: locations.map(l => this.toSummary(l))
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private toSummary(location: LocationWithRelations): ILocationSummary {
        return {
            id: location.id,
            name: location.name,
            description: location.description ?? undefined,
            address: location.address ?? undefined,
            stockItemCount: location._count?.stockItems ?? 0,
            machineCount: location._count?.machines ?? 0
        };
    }
}
