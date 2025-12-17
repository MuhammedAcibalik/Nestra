"use strict";
/**
 * Material Repository
 * Following SRP - Only handles material data access
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class MaterialRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.materialTypes.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.materialTypes.id, id),
            with: {
                thicknessRanges: true
            }
        });
        return result ?? null;
    }
    async findAll() {
        return this.db.query.materialTypes.findMany({
            with: {
                thicknessRanges: true
            },
            orderBy: [(0, drizzle_orm_1.asc)(schema_1.materialTypes.name)]
        });
    }
    async findByName(name) {
        const result = await this.db.query.materialTypes.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.materialTypes.name, name)
        });
        return result ?? null;
    }
    async create(data) {
        const [result] = await this.db.insert(schema_1.materialTypes).values({
            name: data.name,
            description: data.description,
            isRotatable: data.isRotatable ?? true,
            defaultDensity: data.defaultDensity
        }).returning();
        return result;
    }
    async update(id, data) {
        const [result] = await this.db.update(schema_1.materialTypes)
            .set({
            name: data.name,
            description: data.description,
            isRotatable: data.isRotatable,
            defaultDensity: data.defaultDensity,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.materialTypes.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.materialTypes).where((0, drizzle_orm_1.eq)(schema_1.materialTypes.id, id));
    }
    async addThicknessRange(materialId, data) {
        const [result] = await this.db.insert(schema_1.thicknessRanges).values({
            materialTypeId: materialId,
            name: data.name,
            minThickness: data.minThickness,
            maxThickness: data.maxThickness
        }).returning();
        return result;
    }
}
exports.MaterialRepository = MaterialRepository;
//# sourceMappingURL=material.repository.js.map