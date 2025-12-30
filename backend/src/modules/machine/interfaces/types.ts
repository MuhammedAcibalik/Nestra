/**
 * Machine Types
 * Core domain types for Machine module
 */

import { machines, machineCompatibilities } from '../../../db/schema';
import { IResult } from '../../../core/interfaces';
import type { ICreateMachineInput, IUpdateMachineInput, IAddCompatibilityInput, IMachineFilter, IMachineDto, ICompatibilityDto } from './dto';

/**
 * Machine entity type inferred from Drizzle schema
 */
export type Machine = typeof machines.$inferSelect;

/**
 * Machine compatibility entity type
 */
export type MachineCompatibility = typeof machineCompatibilities.$inferSelect;

/**
 * Machine with related data
 */
export type MachineWithRelations = Machine & {
    compatibilities?: MachineCompatibility[];
    location?: { id: string; name: string } | null;
    _count?: { compatibilities: number; cuttingPlans: number };
};

/**
 * Compatibility with related data
 */
export type CompatibilityWithRelations = MachineCompatibility & {
    materialType?: { id: string; name: string };
    thicknessRange?: { id: string; name: string } | null;
};

/**
 * Machine repository interface
 */
export interface IMachineRepository {
    findById(id: string): Promise<MachineWithRelations | null>;
    findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]>;
    findByCode(code: string): Promise<Machine | null>;
    create(data: ICreateMachineInput): Promise<Machine>;
    update(id: string, data: IUpdateMachineInput): Promise<Machine>;
    delete(id: string): Promise<void>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility>;
    getCompatibilities(machineId: string): Promise<CompatibilityWithRelations[]>;
    removeCompatibility(compatibilityId: string): Promise<void>;
    findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]>;
}

/**
 * Machine service interface
 */
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
