/**
 * Location Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { locations } from '../../db/schema';
export type Location = typeof locations.$inferSelect;
export type LocationWithRelations = Location & {
    _count?: {
        stockItems: number;
        machines: number;
    };
};
export interface ILocationFilter {
    search?: string;
}
export interface ICreateLocationInput {
    name: string;
    description?: string;
    address?: string;
}
export interface IUpdateLocationInput {
    name?: string;
    description?: string;
    address?: string;
}
export interface ILocationRepository {
    findById(id: string): Promise<LocationWithRelations | null>;
    findByName(name: string): Promise<Location | null>;
    findAll(filter?: ILocationFilter): Promise<LocationWithRelations[]>;
    create(data: ICreateLocationInput): Promise<Location>;
    update(id: string, data: IUpdateLocationInput): Promise<Location>;
    delete(id: string): Promise<void>;
}
export declare class LocationRepository implements ILocationRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<LocationWithRelations | null>;
    findByName(name: string): Promise<Location | null>;
    findAll(filter?: ILocationFilter): Promise<LocationWithRelations[]>;
    create(data: ICreateLocationInput): Promise<Location>;
    update(id: string, data: IUpdateLocationInput): Promise<Location>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=location.repository.d.ts.map