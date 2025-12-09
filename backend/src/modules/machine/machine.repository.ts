/**
 * Machine Repository
 * Following SRP - Only handles Machine data access
 */

import { PrismaClient, Machine, MachineCompatibility, MachineType } from '@prisma/client';

export type MachineWithRelations = Machine & {
    location?: { id: string; name: string } | null;
    compatibilities?: (MachineCompatibility & {
        materialType?: { id: string; name: string };
        thicknessRange?: { id: string; name: string } | null;
    })[];
    _count?: { compatibilities: number; cuttingPlans: number };
};

export interface IMachineFilter {
    machineType?: MachineType;
    isActive?: boolean;
    locationId?: string;
}

export interface ICreateMachineInput {
    code: string;
    name: string;
    description?: string;
    machineType: MachineType;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
    minCutLength?: number;
    kerf?: number;
    onlyGuillotine?: boolean;
    locationId?: string;
}

export interface IUpdateMachineInput {
    name?: string;
    description?: string;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
    minCutLength?: number;
    kerf?: number;
    onlyGuillotine?: boolean;
    locationId?: string;
    isActive?: boolean;
}

export interface IAddCompatibilityInput {
    materialTypeId: string;
    thicknessRangeId?: string;
    cuttingSpeed?: number;
    costPerUnit?: number;
}

export interface IMachineRepository {
    findById(id: string): Promise<MachineWithRelations | null>;
    findByCode(code: string): Promise<Machine | null>;
    findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]>;
    create(data: ICreateMachineInput): Promise<Machine>;
    update(id: string, data: IUpdateMachineInput): Promise<Machine>;
    delete(id: string): Promise<void>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility>;
    removeCompatibility(compatibilityId: string): Promise<void>;
    getCompatibilities(machineId: string): Promise<MachineCompatibility[]>;
    findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]>;
}

interface MachineWhereInput {
    machineType?: MachineType;
    isActive?: boolean;
    locationId?: string;
}

export class MachineRepository implements IMachineRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<MachineWithRelations | null> {
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

    async findByCode(code: string): Promise<Machine | null> {
        return this.prisma.machine.findUnique({ where: { code } });
    }

    async findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]> {
        const where: MachineWhereInput = {};
        if (filter?.machineType) where.machineType = filter.machineType;
        if (filter?.isActive !== undefined) where.isActive = filter.isActive;
        if (filter?.locationId) where.locationId = filter.locationId;

        return this.prisma.machine.findMany({
            where,
            include: {
                location: { select: { id: true, name: true } },
                _count: { select: { compatibilities: true, cuttingPlans: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async create(data: ICreateMachineInput): Promise<Machine> {
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

    async update(id: string, data: IUpdateMachineInput): Promise<Machine> {
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

    async delete(id: string): Promise<void> {
        await this.prisma.machine.delete({ where: { id } });
    }

    async addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility> {
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

    async removeCompatibility(compatibilityId: string): Promise<void> {
        await this.prisma.machineCompatibility.delete({ where: { id: compatibilityId } });
    }

    async getCompatibilities(machineId: string): Promise<MachineCompatibility[]> {
        return this.prisma.machineCompatibility.findMany({
            where: { machineId },
            include: {
                materialType: { select: { id: true, name: true } },
                thicknessRange: { select: { id: true, name: true } }
            }
        });
    }

    async findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]> {
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
