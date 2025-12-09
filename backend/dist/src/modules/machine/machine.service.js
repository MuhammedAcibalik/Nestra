"use strict";
/**
 * Machine Service
 * Following SOLID principles with proper types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineService = void 0;
const interfaces_1 = require("../../core/interfaces");
class MachineService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getMachines(filter) {
        try {
            const machines = await this.repository.findAll(filter);
            const dtos = machines.map((m) => this.toDto(m));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Makineler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getMachineById(id) {
        try {
            const machine = await this.repository.findById(id);
            if (!machine) {
                return (0, interfaces_1.failure)({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }
            return (0, interfaces_1.success)(this.toDto(machine));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Makine getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async createMachine(data) {
        try {
            // Validate required fields
            if (!data.code || !data.name || !data.machineType) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Makine kodu, adı ve türü zorunludur'
                });
            }
            // Check for duplicate code
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                return (0, interfaces_1.failure)({
                    code: 'DUPLICATE_CODE',
                    message: 'Bu makine kodu zaten kullanılıyor'
                });
            }
            const machine = await this.repository.create(data);
            const fullMachine = await this.repository.findById(machine.id);
            return (0, interfaces_1.success)(this.toDto(fullMachine));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_CREATE_ERROR',
                message: 'Makine oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async updateMachine(id, data) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }
            const machine = await this.repository.update(id, data);
            const fullMachine = await this.repository.findById(machine.id);
            return (0, interfaces_1.success)(this.toDto(fullMachine));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_UPDATE_ERROR',
                message: 'Makine güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async deleteMachine(id) {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return (0, interfaces_1.failure)({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }
            // Check if machine has active plans
            if (existing._count?.cuttingPlans && existing._count.cuttingPlans > 0) {
                return (0, interfaces_1.failure)({
                    code: 'MACHINE_HAS_PLANS',
                    message: 'Bu makineye atanmış kesim planları var, silinemez'
                });
            }
            await this.repository.delete(id);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_DELETE_ERROR',
                message: 'Makine silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async addCompatibility(machineId, data) {
        try {
            const machine = await this.repository.findById(machineId);
            if (!machine) {
                return (0, interfaces_1.failure)({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }
            if (!data.materialTypeId) {
                return (0, interfaces_1.failure)({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme türü zorunludur'
                });
            }
            const compatibility = await this.repository.addCompatibility(machineId, data);
            // Fetch full compatibility with relations
            const compatibilities = await this.repository.getCompatibilities(machineId);
            const fullCompatibility = compatibilities.find(c => c.id === compatibility.id);
            return (0, interfaces_1.success)(this.toCompatibilityDto(fullCompatibility));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COMPATIBILITY_CREATE_ERROR',
                message: 'Uyumluluk eklenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async removeCompatibility(compatibilityId) {
        try {
            await this.repository.removeCompatibility(compatibilityId);
            return (0, interfaces_1.success)(undefined);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'COMPATIBILITY_DELETE_ERROR',
                message: 'Uyumluluk silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    async getCompatibleMachines(materialTypeId, thickness) {
        try {
            const machines = await this.repository.findCompatibleMachines(materialTypeId, thickness);
            const dtos = machines.map((m) => this.toDto(m));
            return (0, interfaces_1.success)(dtos);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Uyumlu makineler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }
    toDto(machine) {
        return {
            id: machine.id,
            code: machine.code,
            name: machine.name,
            description: machine.description ?? undefined,
            machineType: machine.machineType,
            maxLength: machine.maxLength ?? undefined,
            maxWidth: machine.maxWidth ?? undefined,
            maxHeight: machine.maxHeight ?? undefined,
            minCutLength: machine.minCutLength ?? undefined,
            kerf: machine.kerf ?? undefined,
            onlyGuillotine: machine.onlyGuillotine,
            location: machine.location ?? undefined,
            isActive: machine.isActive,
            compatibilityCount: machine._count?.compatibilities ?? 0,
            planCount: machine._count?.cuttingPlans ?? 0,
            createdAt: machine.createdAt
        };
    }
    toCompatibilityDto(compatibility) {
        return {
            id: compatibility.id,
            materialType: compatibility.materialType,
            thicknessRange: compatibility.thicknessRange,
            cuttingSpeed: compatibility.cuttingSpeed ?? undefined,
            costPerUnit: compatibility.costPerUnit ?? undefined
        };
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.MachineService = MachineService;
//# sourceMappingURL=machine.service.js.map