/**
 * Machine Service
 * Following SOLID principles with proper types
 */

import { MachineType } from '@prisma/client';
import {
    IResult,
    success,
    failure
} from '../../core/interfaces';
import {
    IMachineRepository,
    MachineWithRelations,
    IMachineFilter,
    ICreateMachineInput,
    IUpdateMachineInput,
    IAddCompatibilityInput
} from './machine.repository';

export interface IMachineDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    machineType: MachineType;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
    minCutLength?: number;
    kerf?: number;
    onlyGuillotine: boolean;
    location?: { id: string; name: string };
    isActive: boolean;
    compatibilityCount: number;
    planCount: number;
    createdAt: Date;
}

export interface ICompatibilityDto {
    id: string;
    materialType: { id: string; name: string };
    thicknessRange?: { id: string; name: string } | null;
    cuttingSpeed?: number;
    costPerUnit?: number;
}

export interface IMachineService {
    getMachines(filter?: IMachineFilter): Promise<IResult<IMachineDto[]>>;
    getMachineById(id: string): Promise<IResult<IMachineDto>>;
    createMachine(data: ICreateMachineInput): Promise<IResult<IMachineDto>>;
    updateMachine(id: string, data: IUpdateMachineInput): Promise<IResult<IMachineDto>>;
    deleteMachine(id: string): Promise<IResult<void>>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<IResult<ICompatibilityDto>>;
    removeCompatibility(compatibilityId: string): Promise<IResult<void>>;
    getCompatibleMachines(materialTypeId: string, thickness: number): Promise<IResult<IMachineDto[]>>;
}

export class MachineService implements IMachineService {
    constructor(private readonly repository: IMachineRepository) { }

    async getMachines(filter?: IMachineFilter): Promise<IResult<IMachineDto[]>> {
        try {
            const machines = await this.repository.findAll(filter);
            const dtos = machines.map((m) => this.toDto(m));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Makineler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getMachineById(id: string): Promise<IResult<IMachineDto>> {
        try {
            const machine = await this.repository.findById(id);

            if (!machine) {
                return failure({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }

            return success(this.toDto(machine));
        } catch (error) {
            return failure({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Makine getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async createMachine(data: ICreateMachineInput): Promise<IResult<IMachineDto>> {
        try {
            // Validate required fields
            if (!data.code || !data.name || !data.machineType) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Makine kodu, adı ve türü zorunludur'
                });
            }

            // Check for duplicate code
            const existing = await this.repository.findByCode(data.code);
            if (existing) {
                return failure({
                    code: 'DUPLICATE_CODE',
                    message: 'Bu makine kodu zaten kullanılıyor'
                });
            }

            const machine = await this.repository.create(data);
            const fullMachine = await this.repository.findById(machine.id);

            return success(this.toDto(fullMachine!));
        } catch (error) {
            return failure({
                code: 'MACHINE_CREATE_ERROR',
                message: 'Makine oluşturulurken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async updateMachine(id: string, data: IUpdateMachineInput): Promise<IResult<IMachineDto>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }

            const machine = await this.repository.update(id, data);
            const fullMachine = await this.repository.findById(machine.id);

            return success(this.toDto(fullMachine!));
        } catch (error) {
            return failure({
                code: 'MACHINE_UPDATE_ERROR',
                message: 'Makine güncellenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async deleteMachine(id: string): Promise<IResult<void>> {
        try {
            const existing = await this.repository.findById(id);
            if (!existing) {
                return failure({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }

            // Check if machine has active plans
            if (existing._count?.cuttingPlans && existing._count.cuttingPlans > 0) {
                return failure({
                    code: 'MACHINE_HAS_PLANS',
                    message: 'Bu makineye atanmış kesim planları var, silinemez'
                });
            }

            await this.repository.delete(id);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'MACHINE_DELETE_ERROR',
                message: 'Makine silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<IResult<ICompatibilityDto>> {
        try {
            const machine = await this.repository.findById(machineId);
            if (!machine) {
                return failure({
                    code: 'MACHINE_NOT_FOUND',
                    message: 'Makine bulunamadı'
                });
            }

            if (!data.materialTypeId) {
                return failure({
                    code: 'VALIDATION_ERROR',
                    message: 'Malzeme türü zorunludur'
                });
            }

            const compatibility = await this.repository.addCompatibility(machineId, data);

            // Fetch full compatibility with relations
            const compatibilities = await this.repository.getCompatibilities(machineId);
            const fullCompatibility = compatibilities.find(c => c.id === compatibility.id);

            return success(this.toCompatibilityDto(fullCompatibility!));
        } catch (error) {
            return failure({
                code: 'COMPATIBILITY_CREATE_ERROR',
                message: 'Uyumluluk eklenirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async removeCompatibility(compatibilityId: string): Promise<IResult<void>> {
        try {
            await this.repository.removeCompatibility(compatibilityId);
            return success(undefined);
        } catch (error) {
            return failure({
                code: 'COMPATIBILITY_DELETE_ERROR',
                message: 'Uyumluluk silinirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    async getCompatibleMachines(materialTypeId: string, thickness: number): Promise<IResult<IMachineDto[]>> {
        try {
            const machines = await this.repository.findCompatibleMachines(materialTypeId, thickness);
            const dtos = machines.map((m) => this.toDto(m));
            return success(dtos);
        } catch (error) {
            return failure({
                code: 'MACHINE_FETCH_ERROR',
                message: 'Uyumlu makineler getirilirken hata oluştu',
                details: { error: this.getErrorMessage(error) }
            });
        }
    }

    private toDto(machine: MachineWithRelations): IMachineDto {
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

    private toCompatibilityDto(compatibility: {
        id: string;
        materialType?: { id: string; name: string };
        thicknessRange?: { id: string; name: string } | null;
        cuttingSpeed: number | null;
        costPerUnit: number | null;
    }): ICompatibilityDto {
        return {
            id: compatibility.id,
            materialType: compatibility.materialType!,
            thicknessRange: compatibility.thicknessRange,
            cuttingSpeed: compatibility.cuttingSpeed ?? undefined,
            costPerUnit: compatibility.costPerUnit ?? undefined
        };
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
