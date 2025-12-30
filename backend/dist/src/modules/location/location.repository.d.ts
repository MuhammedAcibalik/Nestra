/**
 * Location Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { Location, LocationWithRelations, ILocationRepository, ILocationFilter, ICreateLocationInput, IUpdateLocationInput } from './interfaces';
export declare class LocationRepository implements ILocationRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<LocationWithRelations | null>;
    findByName(name: string): Promise<Location | null>;
    findAll(filter?: ILocationFilter): Promise<Location[]>;
    create(data: ICreateLocationInput): Promise<Location>;
    update(id: string, data: IUpdateLocationInput): Promise<Location>;
    delete(id: string): Promise<void>;
}
export type { Location, LocationWithRelations, ILocationRepository, ILocationFilter, ICreateLocationInput, IUpdateLocationInput } from './interfaces';
//# sourceMappingURL=location.repository.d.ts.map