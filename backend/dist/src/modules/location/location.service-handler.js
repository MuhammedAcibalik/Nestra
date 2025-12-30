"use strict";
/**
 * Location Service Handler
 * Exposes location module as internal service
 * Following ISP - only exposes needed operations for cross-module access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationServiceHandler = void 0;
// ==================== SERVICE HANDLER ====================
class LocationServiceHandler {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async handle(request) {
        const { method, path, data } = request;
        // Route: GET /locations/:id
        if (method === 'GET' && /^\/locations\/[\w-]+$/.exec(path)) {
            const locationId = path.split('/')[2];
            return this.getLocationById(locationId);
        }
        // Route: GET /locations
        if (method === 'GET' && path === '/locations') {
            return this.getAllLocations();
        }
        // Route: GET /locations/name/:name
        if (method === 'GET' && /^\/locations\/name\/.+$/.exec(path)) {
            const name = decodeURIComponent(path.split('/')[3]);
            return this.getLocationByName(name);
        }
        // Route: POST /locations/query
        if (method === 'POST' && path === '/locations/query') {
            const filter = data;
            return this.queryLocations(filter);
        }
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route not found: ${method} ${path}`
            }
        };
    }
    async getLocationById(locationId) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getLocationByName(name) {
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
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async getAllLocations() {
        try {
            const locations = await this.repository.findAll();
            return {
                success: true,
                data: locations.map((l) => this.toSummary(l))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    async queryLocations(filter) {
        try {
            const locations = await this.repository.findAll(filter);
            return {
                success: true,
                data: locations.map((l) => this.toSummary(l))
            };
        }
        catch (error) {
            return {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
    toSummary(location) {
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
exports.LocationServiceHandler = LocationServiceHandler;
//# sourceMappingURL=location.service-handler.js.map