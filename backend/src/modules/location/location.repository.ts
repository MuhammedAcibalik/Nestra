/**
 * Location Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { locations } from '../../db/schema';
import { eq, asc, ilike, or } from 'drizzle-orm';
import {
    Location,
    LocationWithRelations,
    ILocationRepository,
    ILocationFilter,
    ICreateLocationInput,
    IUpdateLocationInput
} from './interfaces';

export class LocationRepository implements ILocationRepository {
    constructor(private readonly db: Database) { }

    async findById(id: string): Promise<LocationWithRelations | null> {
        const result = await this.db.query.locations.findFirst({
            where: eq(locations.id, id)
        });
        return result ?? null;
    }

    async findByName(name: string): Promise<Location | null> {
        const result = await this.db.query.locations.findFirst({
            where: eq(locations.name, name)
        });
        return result ?? null;
    }

    async findAll(filter?: ILocationFilter): Promise<Location[]> {
        if (filter?.search) {
            return this.db
                .select()
                .from(locations)
                .where(
                    or(
                        ilike(locations.name, `%${filter.search}%`),
                        ilike(locations.description, `%${filter.search}%`)
                    )
                )
                .orderBy(asc(locations.name));
        }

        return this.db.query.locations.findMany({
            orderBy: [asc(locations.name)]
        });
    }

    async create(data: ICreateLocationInput): Promise<Location> {
        const [result] = await this.db
            .insert(locations)
            .values({
                name: data.name,
                description: data.description,
                address: data.address
            })
            .returning();
        return result;
    }

    async update(id: string, data: IUpdateLocationInput): Promise<Location> {
        const [result] = await this.db
            .update(locations)
            .set({
                name: data.name,
                description: data.description,
                address: data.address,
                updatedAt: new Date()
            })
            .where(eq(locations.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(locations).where(eq(locations.id, id));
    }
}

// Re-export types for backward compatibility
export type { Location, LocationWithRelations, ILocationRepository, ILocationFilter, ICreateLocationInput, IUpdateLocationInput } from './interfaces';
