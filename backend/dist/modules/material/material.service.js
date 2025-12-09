"use strict";
/**
 * Material Service Implementation
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialService = void 0;
const interfaces_1 = require("../../core/interfaces");
class MaterialService {
    materialRepository;
    constructor(materialRepository) {
        this.materialRepository = materialRepository;
    }
    async getMaterials() {
        try {
            const materials = await this.materialRepository.findAll();
            const dtos = materials.map((m) => this.toDto(m));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MATERIAL_FETCH_ERROR',
                message: 'Malzemeler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getMaterialById(id) {
        try {
            const material = await this.materialRepository.findById(id);
            if (!material) {
                return (0, interfaces_1.failure)({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(material));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MATERIAL_FETCH_ERROR',
                message: 'Malzeme getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createMaterial(data) {
        try {
            if (!data.name || data.name.trim().length === 0) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme adı zorunludur'
                });
            }
            const existing = await this.materialRepository.findByName(data.name);
            if (existing) {
                return (0, interfaces_1.failure)({
                    code: 'DUPLICATE_MATERIAL',
                    message: 'Bu isimde bir malzeme zaten mevcut'
                });
            }
            const material = await this.materialRepository.create(data);
            const fullMaterial = await this.materialRepository.findById(material.id);
            return (0, interfaces_1.success)(this.toDto(fullMaterial));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MATERIAL_CREATE_ERROR',
                message: 'Malzeme oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateMaterial(id, data) {
        try {
            const existing = await this.materialRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }
            if (data.name && data.name !== existing.name) {
                const duplicate = await this.materialRepository.findByName(data.name);
                if (duplicate) {
                    return (0, interfaces_1.failure)({
                        code: 'DUPLICATE_MATERIAL',
                        message: 'Bu isimde bir malzeme zaten mevcut'
                    });
                }
            }
            const material = await this.materialRepository.update(id, data);
            const fullMaterial = await this.materialRepository.findById(material.id);
            return (0, interfaces_1.success)(this.toDto(fullMaterial));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MATERIAL_UPDATE_ERROR',
                message: 'Malzeme güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteMaterial(id) {
        try {
            const existing = await this.materialRepository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }
            if (existing._count && existing._count.stockItems > 0) {
                return (0, interfaces_1.failure)({
                    code: 'MATERIAL_HAS_STOCK',
                    message: 'Bu malzemeye ait stok kalemleri var, önce onları silmelisiniz'
                });
            }
            await this.materialRepository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MATERIAL_DELETE_ERROR',
                message: 'Malzeme silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async addThicknessRange(materialId, data) {
        try {
            const material = await this.materialRepository.findById(materialId);
            if (!material) {
                return (0, interfaces_1.failure)({
                    code: 'MATERIAL_NOT_FOUND',
                    message: 'Malzeme bulunamadı'
                });
            }
            if (data.minThickness >= data.maxThickness) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Minimum kalınlık maksimum kalınlıktan küçük olmalıdır'
                });
            }
            const thickness = await this.materialRepository.addThicknessRange(materialId, data);
            return (0, interfaces_1.success)({
                id: thickness.id,
                name: thickness.name,
                minThickness: thickness.minThickness,
                maxThickness: thickness.maxThickness
            });
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'THICKNESS_CREATE_ERROR',
                message: 'Kalınlık aralığı oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(material) {
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
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.MaterialService = MaterialService;
//# sourceMappingURL=material.service.js.map