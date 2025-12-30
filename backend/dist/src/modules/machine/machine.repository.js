"use strict";
/**
 * Machine Repository
 * Migrated to Drizzle ORM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineRepository = void 0;
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class MachineRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const result = await this.db.query.machines.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.machines.id, id),
            with: {
                compatibilities: true,
                location: true
            }
        });
        return result ?? null;
    }
    async findAll(filter) {
        const conditions = [];
        if (filter?.locationId)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.machines.locationId, filter.locationId));
        if (filter?.machineType)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.machines.machineType, filter.machineType));
        if (filter?.isActive !== undefined)
            conditions.push((0, drizzle_orm_1.eq)(schema_1.machines.isActive, filter.isActive));
        return this.db.query.machines.findMany({
            where: conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined,
            with: {
                compatibilities: true,
                location: true
            },
            orderBy: [(0, drizzle_orm_1.asc)(schema_1.machines.name)]
        });
    }
    async findByCode(code) {
        const result = await this.db.query.machines.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.machines.code, code)
        });
        return result ?? null;
    }
    async create(data) {
        const [result] = await this.db
            .insert(schema_1.machines)
            .values({
            code: data.code,
            name: data.name,
            description: data.description,
            machineType: data.machineType,
            maxLength: data.maxLength,
            maxWidth: data.maxWidth,
            maxHeight: data.maxHeight,
            minCutLength: data.minCutLength,
            kerf: data.kerf,
            onlyGuillotine: data.onlyGuillotine ?? false,
            locationId: data.locationId
        })
            .returning();
        return result;
    }
    async update(id, data) {
        const [result] = await this.db
            .update(schema_1.machines)
            .set({
            name: data.name,
            description: data.description,
            maxLength: data.maxLength,
            maxWidth: data.maxWidth,
            minCutLength: data.minCutLength,
            kerf: data.kerf,
            isActive: data.isActive,
            updatedAt: new Date()
        })
            .where((0, drizzle_orm_1.eq)(schema_1.machines.id, id))
            .returning();
        return result;
    }
    async delete(id) {
        await this.db.delete(schema_1.machines).where((0, drizzle_orm_1.eq)(schema_1.machines.id, id));
    }
    async addCompatibility(machineId, data) {
        const [result] = await this.db
            .insert(schema_1.machineCompatibilities)
            .values({
            machineId,
            materialTypeId: data.materialTypeId,
            thicknessRangeId: data.thicknessRangeId,
            cuttingSpeed: data.cuttingSpeed,
            costPerUnit: data.costPerUnit
        })
            .returning();
        return result;
    }
    async getCompatibilities(machineId) {
        return this.db.query.machineCompatibilities.findMany({
            where: (0, drizzle_orm_1.eq)(schema_1.machineCompatibilities.machineId, machineId),
            with: {
                materialType: true,
                thicknessRange: true
            }
        });
    }
    async removeCompatibility(compatibilityId) {
        await this.db.delete(schema_1.machineCompatibilities).where((0, drizzle_orm_1.eq)(schema_1.machineCompatibilities.id, compatibilityId));
    }
    async findCompatibleMachines(materialTypeId, thickness) {
        // Find machines that have compatible material types
        const compatibleMachineIds = await this.db
            .select({ machineId: schema_1.machineCompatibilities.machineId })
            .from(schema_1.machineCompatibilities)
            .where((0, drizzle_orm_1.eq)(schema_1.machineCompatibilities.materialTypeId, materialTypeId));
        if (compatibleMachineIds.length === 0)
            return [];
        const ids = compatibleMachineIds.map((c) => c.machineId);
        return this.db.query.machines.findMany({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.machines.isActive, true), (0, drizzle_orm_1.or)(...ids.map((id) => (0, drizzle_orm_1.eq)(schema_1.machines.id, id)))),
            with: {
                compatibilities: true,
                location: true
            }
        });
    }
}
exports.MachineRepository = MachineRepository;
//# sourceMappingURL=machine.repository.js.map