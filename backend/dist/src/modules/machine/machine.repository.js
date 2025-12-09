"use strict";
/**
 * Machine Repository
 * Following SRP - Only handles Machine data access
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineRepository = void 0;
class MachineRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        return this.prisma.machine.findUnique({
            where: { id },
            include: {
                location: { select: { id: true, name: true } },
                compatibilities: {
                    include: {
                        materialType: { select: { id: true, name: true } },
                        thicknessRange: { select: { id: true, name: true } }
                    }
                },
                _count: { select: { compatibilities: true, cuttingPlans: true } }
            }
        });
    }
    async findByCode(code) {
        return this.prisma.machine.findUnique({ where: { code } });
    }
    async findAll(filter) {
        const where = {};
        if (filter?.machineType)
            where.machineType = filter.machineType;
        if (filter?.isActive !== undefined)
            where.isActive = filter.isActive;
        if (filter?.locationId)
            where.locationId = filter.locationId;
        return this.prisma.machine.findMany({
            where,
            include: {
                location: { select: { id: true, name: true } },
                _count: { select: { compatibilities: true, cuttingPlans: true } }
            },
            orderBy: { name: 'asc' }
        });
    }
    async create(data) {
        return this.prisma.machine.create({
            data: {
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
            }
        });
    }
    async update(id, data) {
        return this.prisma.machine.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                maxLength: data.maxLength,
                maxWidth: data.maxWidth,
                maxHeight: data.maxHeight,
                minCutLength: data.minCutLength,
                kerf: data.kerf,
                onlyGuillotine: data.onlyGuillotine,
                locationId: data.locationId,
                isActive: data.isActive
            }
        });
    }
    async delete(id) {
        await this.prisma.machine.delete({ where: { id } });
    }
    async addCompatibility(machineId, data) {
        return this.prisma.machineCompatibility.create({
            data: {
                machineId,
                materialTypeId: data.materialTypeId,
                thicknessRangeId: data.thicknessRangeId,
                cuttingSpeed: data.cuttingSpeed,
                costPerUnit: data.costPerUnit
            }
        });
    }
    async removeCompatibility(compatibilityId) {
        await this.prisma.machineCompatibility.delete({ where: { id: compatibilityId } });
    }
    async getCompatibilities(machineId) {
        return this.prisma.machineCompatibility.findMany({
            where: { machineId },
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } }
            }
        });
    }
    async findCompatibleMachines(materialTypeId, thickness) {
        return this.prisma.machine.findMany({
            where: {
                isActive: true,
                compatibilities: {
                    some: {
                        materialTypeId,
                        OR: [
                            { thicknessRangeId: null },
                            {
                                thicknessRange: {
                                    minThickness: { lte: thickness },
                                    maxThickness: { gte: thickness }
                                }
                            }
                        ]
                    }
                }
            },
            include: {
                location: { select: { id: true, name: true } },
                compatibilities: {
                    where: { materialTypeId },
                    include: {
                        materialType: { select: { id: true, name: true } },
                        thicknessRange: { select: { id: true, name: true } }
                    }
                },
                _count: { select: { compatibilities: true, cuttingPlans: true } }
            }
        });
    }
}
exports.MachineRepository = MachineRepository;
//# sourceMappingURL=machine.repository.js.map