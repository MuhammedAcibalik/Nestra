/**
 * Material Service Implementation
 * Following SOLID principles with proper types
 */
import { IMaterialService, IMaterialDto, IThicknessDto, ICreateMaterialInput, IUpdateMaterialInput, ICreateThicknessInput, IResult } from '../../core/interfaces';
import { IMaterialRepository } from './material.repository';
export declare class MaterialService implements IMaterialService {
    private readonly materialRepository;
    constructor(materialRepository: IMaterialRepository);
    getMaterials(): Promise<IResult<IMaterialDto[]>>;
    getMaterialById(id: string): Promise<IResult<IMaterialDto>>;
    createMaterial(data: ICreateMaterialInput): Promise<IResult<IMaterialDto>>;
    updateMaterial(id: string, data: IUpdateMaterialInput): Promise<IResult<IMaterialDto>>;
    deleteMaterial(id: string): Promise<IResult<void>>;
    addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<IResult<IThicknessDto>>;
    private toDto;
    private getErrorMessage;
}
//# sourceMappingURL=material.service.d.ts.map