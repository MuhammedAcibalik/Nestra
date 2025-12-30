"use strict";
/**
 * Location Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class LocationRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.locations.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.locations.id, id)
        });
        return result ?? null;
    }
    async findByName(name) {
        const result = await this.db.query.locations.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.locations.name, name)
        });
        return result ?? null;
    }
    async findAll(filter) {
        if (filter?.search) {
            return this.db
                .select()
                .from(schema_1.locations)
                .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.locations.name, `%${filter.search}%`), (0, drizzle_orm_1.ilike)(schema_1.locations.description, `%${filter.search}%`)))
                .orderBy((0, drizzle_orm_1.asc)(schema_1.locations.name));
        }
        return this.db.query.locations.findMany({
            orderBy: [(0, drizzle_orm_1.asc)(schema_1.locations.name)]
        });
    }
    async create(data) {
        const [result] = await this.db
            .insert(schema_1.locations)
            .values({
            name: data.name,
            description: data.description,
            address: data.address
        })
            .returning();
        return result;
    }
    async update(id, data) {
        const [result] = await this.db
            .update(schema_1.locations)
            .set({
            name: data.name,
            description: data.description,
            address: data.address,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.locations.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.locations).where((0, drizzle_orm_1.eq)(schema_1.locations.id, id));
    }
}
exports.LocationRepository = LocationRepository;
//# sourceMappingURL=location.repository.js.map