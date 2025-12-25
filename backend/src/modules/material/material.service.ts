/**
 * Material Service Implementation
 * Following SOLID principles with proper types
 */

import {
    IMaterialService,
    IMaterialDto,
    IThicknessDto,
    ICreateMaterialInput,
    IUpdateMaterialInput,
    ICreateThicknessInput,
    IResult,
    success,
    failure
} from '../../core/interfaces';
import { IMaterialRepository, MaterialTypeWithRelations } from './material.repository';

export class MaterialService implements IMaterialService {
    constructor(private readonly materialRepository: IMaterialRepository) {}

    async getMaterials(): Promise<IResult<IMaterialDto[]>> {
        try {
            const materials = await this.materialRepository.findAll();
            const dtos = materials.map((m) => this.toDto(m));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'MATERIAL_FETCH_ERROR',
                message: 'Malzemeler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getMaterialById(id: string): Promise<IResult<IMaterialDto>> {
        try {
            const material = await this.materialRepository.findById(id);

            if (!material) {
                return failure({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }

            return success(this.toDto(material));
        } catch (error) {
            return failure({
                code: 'MATERIAL_FETCH_ERROR',
                message: 'Malzeme getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createMaterial(data: ICreateMaterialInput): Promise<IResult<IMaterialDto>> {
        try {
            if (!data.name || data.name.trim().length === 0) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme adı zorunludur'
                });
            }

            const existing = await this.materialRepository.findByName(data.name);
            if (existing) {
                return failure({
                    code: 'DUPLICATE_MATERIAL',
                    message: 'Bu isimde bir malzeme zaten mevcut'
                });
            }

            const material = await this.materialRepository.create(data);
            const fullMaterial = await this.materialRepository.findById(material.id);

            return success(this.toDto(fullMaterial!));
        } catch (error) {
            return failure({
                code: 'MATERIAL_CREATE_ERROR',
                message: 'Malzeme oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateMaterial(id: string, data: IUpdateMaterialInput): Promise<IResult<IMaterialDto>> {
        try {
            const existing = await this.materialRepository.findById(id);
            if (!existing) {
                return failure({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }

            if (data.name && data.name !== existing.name) {
                const duplicate = await this.materialRepository.findByName(data.name);
                if (duplicate) {
                    return failure({
                        code: 'DUPLICATE_MATERIAL',
                        message: 'Bu isimde bir malzeme zaten mevcut'
                    });
                }
            }

            const material = await this.materialRepository.update(id, data);
            const fullMaterial = await this.materialRepository.findById(material.id);

            return success(this.toDto(fullMaterial!));
        } catch (error) {
            return failure({
                code: 'MATERIAL_UPDATE_ERROR',
                message: 'Malzeme güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteMaterial(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.materialRepository.findById(id);
            if (!existing) {
                return failure({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }

            if (existing._count && existing._count.stockItems > 0) {
                return failure({
                    code: 'MATERIAL_HAS_STOCK',
                    message: 'Bu malzemeye ait stok kalemleri var, önce onları silmelisiniz'
                });
            }

            await this.materialRepository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'MATERIAL_DELETE_ERROR',
                message: 'Malzeme silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async addThicknessRange(materialId: string, data: ICreateThicknessInput): Promise<IResult<IThicknessDto>> {
        try {
            const material = await this.materialRepository.findById(materialId);
            if (!material) {
                return failure({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }

            if (data.minThickness >= data.maxThickness) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Minimum kalınlık maksimum kalınlıktan küçük olmalıdır'
                });
            }

            const thickness = await this.materialRepository.addThicknessRange(materialId, data);

            return success({
                id: thickness.id,
                name: thickness.name,
                minThickness: thickness.minThickness,
                maxThickness: thickness.maxThickness
            });
        } catch (error) {
            return failure({
                code: 'THICKNESS_CREATE_ERROR',
                message: 'Kalınlık aralığı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDto(material: MaterialTypeWithRelations): IMaterialDto {
        return {
            id: material.id,
            name: material.name,
            description: material.description ?? undefined,
            isRotatable: material.isRotatable,
            defaultDensity: material.defaultDensity ?? undefined,
            thicknessRanges: (material.thicknessRanges ?? []).map((t) => ({
                id: t.id,
                name: t.name,
                minThickness: t.minThickness,
                maxThickness: t.maxThickness
            })),
            stockCount: material._count?.stockItems
        };
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
