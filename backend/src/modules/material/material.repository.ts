/**
 * Material Repository
 * Following SRP - Only handles material data access
 */

import { PrismaClient, MaterialType, ThicknessRange } from '@prisma/client';
import { ICreateMaterialInput, IUpdateMaterialInput, ICreateThicknessInput } from '../../core/interfaces';

export type MaterialTypeWithRelations = MaterialType & {
    thicknessRanges?: ThicknessRange[];
    _count?: { stockItems: number };
};

export interface IMaterialRepository {
    findById(id: string): Promise<MaterialTypeWithRelations | null>;
    findAll(): Promise<MaterialTypeWithRelations[]>;
    findByName(name: string): Promise<MaterialType | null>;
    create(data: ICreateMaterialInput): Promise<MaterialType>;
    update(id: string, data: IUpdateMaterialInput): Promise<MaterialType>;
    delete(id: string): Promise<void>;
    addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<ThicknessRange>;
}

export class MaterialRepository implements IMaterialRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<MaterialTypeWithRelations | null> {
        return this.prisma.materialType.findUnique({
            where: { id },
            include: {
                thicknessRanges: true,
                _count: { select: { stockItems: true } }
            }
        });
    }

    async findAll(): Promise<MaterialTypeWithRelations[]> {
        return this.prisma.materialType.findMany({
            include: {
                thicknessRanges: true,
                _count: { select: { stockItems: true } }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findByName(name: string): Promise<MaterialType | null> {
        return this.prisma.materialType.findUnique({ where: { name } });
    }

    async create(data: ICreateMaterialInput): Promise<MaterialType> {
        return this.prisma.materialType.create({
            data: {
                name: data.name,
                description: data.description,
                isRotatable: data.isRotatable ?? true,
                defaultDensity: data.defaultDensity
            }
        });
    }

    async update(id: string, data: IUpdateMaterialInput): Promise<MaterialType> {
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

    async delete(id: string): Promise<void> {
        await this.prisma.materialType.delete({ where: { id } });
    }

    async addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<ThicknessRange> {
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
