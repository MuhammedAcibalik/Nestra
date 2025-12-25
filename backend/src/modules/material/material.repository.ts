/**
 * Material Repository
 * Following SRP - Only handles material data access
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { materialTypes, thicknessRanges, materialTypesRelations, thicknessRangesRelations } from '../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { ICreateMaterialInput, IUpdateMaterialInput, ICreateThicknessInput } from '../../core/interfaces';

// Type definitions
export type MaterialType = typeof materialTypes.$inferSelect;
export type ThicknessRange = typeof thicknessRanges.$inferSelect;

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
    constructor(private readonly db: Database) {}

    async findById(id: string): Promise<MaterialTypeWithRelations | null> {
        const result = await this.db.query.materialTypes.findFirst({
            where: eq(materialTypes.id, id),
            with: {
                thicknessRanges: true
            }
        });
        return result ?? null;
    }

    async findAll(): Promise<MaterialTypeWithRelations[]> {
        return this.db.query.materialTypes.findMany({
            with: {
                thicknessRanges: true
            },
            orderBy: [asc(materialTypes.name)]
        });
    }

    async findByName(name: string): Promise<MaterialType | null> {
        const result = await this.db.query.materialTypes.findFirst({
            where: eq(materialTypes.name, name)
        });
        return result ?? null;
    }

    async create(data: ICreateMaterialInput): Promise<MaterialType> {
        const [result] = await this.db
            .insert(materialTypes)
            .values({
                name: data.name,
                description: data.description,
                isRotatable: data.isRotatable ?? true,
                defaultDensity: data.defaultDensity
            })
            .returning();
        return result;
    }

    async update(id: string, data: IUpdateMaterialInput): Promise<MaterialType> {
        const [result] = await this.db
            .update(materialTypes)
            .set({
                name: data.name,
                description: data.description,
                isRotatable: data.isRotatable,
                defaultDensity: data.defaultDensity,
                updatedAt: new Date()
            })
            .where(eq(materialTypes.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(materialTypes).where(eq(materialTypes.id, id));
    }

    async addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<ThicknessRange> {
        const [result] = await this.db
            .insert(thicknessRanges)
            .values({
                materialTypeId: materialId,
                name: data.name,
                minThickness: data.minThickness,
                maxThickness: data.maxThickness
            })
            .returning();
        return result;
    }
}
