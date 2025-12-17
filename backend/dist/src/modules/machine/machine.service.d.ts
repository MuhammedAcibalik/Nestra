/**
 * Machine Service
 * Following SOLID principles with proper types
 */
import { IResult } from '../../core/interfaces';
import { IMachineRepository, MachineType, IMachineFilter, ICreateMachineInput, IUpdateMachineInput, IAddCompatibilityInput } from './machine.repository';
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
    location?: {
        id: string;
        name: string;
    };
    isActive: boolean;
    compatibilityCount: number;
    planCount: number;
    createdAt: Date;
}
export interface ICompatibilityDto {
    id: string;
    materialType: {
        id: string;
        name: string;
    };
    thicknessRange?: {
        id: string;
        name: string;
    } | null;
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
export declare class MachineService implements IMachineService {
    private readonly repository;
    constructor(repository: IMachineRepository);
    getMachines(filter?: IMachineFilter): Promise<IResult<IMachineDto[]>>;
    getMachineById(id: string): Promise<IResult<IMachineDto>>;
    createMachine(data: ICreateMachineInput): Promise<IResult<IMachineDto>>;
    updateMachine(id: string, data: IUpdateMachineInput): Promise<IResult<IMachineDto>>;
    deleteMachine(id: string): Promise<IResult<void>>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<IResult<ICompatibilityDto>>;
    removeCompatibility(compatibilityId: string): Promise<IResult<void>>;
    getCompatibleMachines(materialTypeId: string, thickness: number): Promise<IResult<IMachineDto[]>>;
    private toDto;
    private toCompatibilityDto;
    private getErrorMessage;
}
//# sourceMappingURL=machine.service.d.ts.map