/**
 * Location Types
 * Core domain types for Location module
 */

import { locations } from '../../../db/schema';

/**
 * Location entity type inferred from Drizzle schema
 */
export type Location = typeof locations.$inferSelect;

/**
 * Location with related data
 */
export type LocationWithRelations = Location & {
    _count?: { stockItems: number; machines: number };
};

/**
 * Location repository interface
 */
export interface ILocationRepository {
    findById(id: string): Promise<LocationWithRelations | null>;
    findByName(name: string): Promise<Location | null>;
    findAll(filter?: { search?: string }): Promise<LocationWithRelations[]>;
    create(data: { name: string; description?: string; address?: string }): Promise<Location>;
    update(id: string, data: { name?: string; description?: string; address?: string }): Promise<Location>;
    delete(id: string): Promise<void>;
}

/**
 * Location service interface
 */
export interface ILocationService {
    getLocations(filter?: { search?: string }): Promise<import('../../../core/interfaces').IResult<import('./dto').ILocationDto[]>>;
    getLocationById(id: string): Promise<import('../../../core/interfaces').IResult<import('./dto').ILocationDto>>;
    createLocation(data: import('./dto').ICreateLocationInput): Promise<import('../../../core/interfaces').IResult<import('./dto').ILocationDto>>;
    updateLocation(id: string, data: import('./dto').IUpdateLocationInput): Promise<import('../../../core/interfaces').IResult<import('./dto').ILocationDto>>;
    deleteLocation(id: string): Promise<import('../../../core/interfaces').IResult<void>>;
}
