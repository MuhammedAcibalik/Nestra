"use strict";
/**
 * Material Repository
 * Following SRP - Only handles material data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialRepository = void 0;
class MaterialRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.materialType.findUnique({
            where: { id },
            include: {
                thicknessRanges: true,
                _count: { select: { stockItems: true } }
            }
        });
    }
    async findAll() {
        return this.prisma.materialType.findMany({
            include: {
                thicknessRanges: true,
                _count: { select: { stockItems: true } }
            },
            orderBy: { name: 'asc' }
        });
    }
    async findByName(name) {
        return this.prisma.materialType.findUnique({ where: { name } });
    }
    async create(data) {
        return this.prisma.materialType.create({
            data: {
                name: data.name,
                description: data.description,
                isRotatable: data.isRotatable ?? true,
                defaultDensity: data.defaultDensity
            }
        });
    }
    async update(id, data) {
        return this.prisma.materialType.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                isRotatable: data.isRotatable,
                defaultDensity: data.defaultDensity
            }
        });
    }
    async delete(id) {
        await this.prisma.materialType.delete({ where: { id } });
    }
    async addThicknessRange(materialId, data) {
        return this.prisma.thicknessRange.create({
            data: {
                materialTypeId: materialId,
                name: data.name,
                minThickness: data.minThickness,
                maxThickness: data.maxThickness
            }
        });
    }
}
exports.MaterialRepository = MaterialRepository;
//# sourceMappingURL=material.repository.js.map