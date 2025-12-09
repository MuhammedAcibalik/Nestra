/**
 * Machine Repository
 * Following SRP - Only handles Machine data access
 */
import { PrismaClient, Machine, MachineCompatibility, MachineType } from '@prisma/client';
export type MachineWithRelations = Machine & {
    location?: {
        id: string;
        name: string;
    } | null;
    compatibilities?: (MachineCompatibility & {
        materialType?: {
            id: string;
            name: string;
        };
        thicknessRange?: {
            id: string;
            name: string;
        } | null;
    })[];
    _count?: {
        compatibilities: number;
        cuttingPlans: number;
    };
};
export interface IMachineFilter {
    machineType?: MachineType;
    isActive?: boolean;
    locationId?: string;
}
export interface ICreateMachineInput {
    code: string;
    name: string;
    description?: string;
    machineType: MachineType;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
    minCutLength?: number;
    kerf?: number;
    onlyGuillotine?: boolean;
    locationId?: string;
}
export interface IUpdateMachineInput {
    name?: string;
    description?: string;
    maxLength?: number;
    maxWidth?: number;
    maxHeight?: number;
    minCutLength?: number;
    kerf?: number;
    onlyGuillotine?: boolean;
    locationId?: string;
    isActive?: boolean;
}
export interface IAddCompatibilityInput {
    materialTypeId: string;
    thicknessRangeId?: string;
    cuttingSpeed?: number;
    costPerUnit?: number;
}
export interface IMachineRepository {
    findById(id: string): Promise<MachineWithRelations | null>;
    findByCode(code: string): Promise<Machine | null>;
    findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]>;
    create(data: ICreateMachineInput): Promise<Machine>;
    update(id: string, data: IUpdateMachineInput): Promise<Machine>;
    delete(id: string): Promise<void>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility>;
    removeCompatibility(compatibilityId: string): Promise<void>;
    getCompatibilities(machineId: string): Promise<MachineCompatibility[]>;
    findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]>;
}
export declare class MachineRepository implements IMachineRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findById(id: string): Promise<MachineWithRelations | null>;
    findByCode(code: string): Promise<Machine | null>;
    findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]>;
    create(data: ICreateMachineInput): Promise<Machine>;
    update(id: string, data: IUpdateMachineInput): Promise<Machine>;
    delete(id: string): Promise<void>;
    addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility>;
    removeCompatibility(compatibilityId: string): Promise<void>;
    getCompatibilities(machineId: string): Promise<MachineCompatibility[]>;
    findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]>;
}
//# sourceMappingURL=machine.repository.d.ts.map