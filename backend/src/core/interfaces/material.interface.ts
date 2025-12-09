/**
 * Material Module Interfaces
 */

import { IResult } from './result.interface';

export interface IMaterialService {
    getMaterials(): Promise<IResult<IMaterialDto[]>>;
    getMaterialById(id: string): Promise<IResult<IMaterialDto>>;
    createMaterial(data: ICreateMaterialInput): Promise<IResult<IMaterialDto>>;
    updateMaterial(id: string, data: IUpdateMaterialInput): Promise<IResult<IMaterialDto>>;
    deleteMaterial(id: string): Promise<IResult<void>>;
    addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<IResult<IThicknessDto>>;
}

export interface IMaterialDto {
    id: string;
    name: string;
    description?: string;
    isRotatable: boolean;
    defaultDensity?: number;
    thicknessRanges: IThicknessDto[];
    stockCount?: number;
}

export interface IThicknessDto {
    id: string;
    name: string;
    minThickness: number;
    maxThickness: number;
}

export interface ICreateMaterialInput {
    name: string;
    description?: string;
    isRotatable?: boolean;
    defaultDensity?: number;
}

export interface IUpdateMaterialInput extends Partial<ICreateMaterialInput> { }

export interface ICreateThicknessInput {
    name: string;
    minThickness: number;
    maxThickness: number;
}
