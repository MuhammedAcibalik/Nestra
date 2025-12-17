/**
 * Material Repository
 * Following SRP - Only handles material data access
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { materialTypes, thicknessRanges } from '../../db/schema';
import { ICreateMaterialInput, IUpdateMaterialInput, ICreateThicknessInput } from '../../core/interfaces';
export type MaterialType = typeof materialTypes.$inferSelect;
export type ThicknessRange = typeof thicknessRanges.$inferSelect;
export type MaterialTypeWithRelations = MaterialType & {
    thicknessRanges?: ThicknessRange[];
    _count?: {
        stockItems: number;
    };
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
export declare class MaterialRepository implements IMaterialRepository {
    private readonly db;
    constructor(db: Database);
    findById(id: string): Promise<MaterialTypeWithRelations | null>;
    findAll(): Promise<MaterialTypeWithRelations[]>;
    findByName(name: string): Promise<MaterialType | null>;
    create(data: ICreateMaterialInput): Promise<MaterialType>;
    update(id: string, data: IUpdateMaterialInput): Promise<MaterialType>;
    delete(id: string): Promise<void>;
    addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<ThicknessRange>;
}
//# sourceMappingURL=material.repository.d.ts.map