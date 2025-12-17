/**
 * Machine Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
import { machines, machineCompatibilities } from '../../db/schema';
import { MachineType } from '../../db/schema/enums';
export type Machine = typeof machines.$inferSelect;
export type MachineCompatibility = typeof machineCompatibilities.$inferSelect;
export { MachineType } from '../../db/schema/enums';
export type MachineWithRelations = Machine & {
    compatibilities?: MachineCompatibility[];
    location?: {
        id: string;
        name: string;
    } | null;
    _count?: {
        compatibilities: number;
        cuttingPlans: number;
    };
};
export type CompatibilityWithRelations = MachineCompatibility & {
    materialType?: {
        id: string;
        name: string;
    };
    thicknessRange?: {
        id: string;
        name: string;
    } | null;
};
export interface IMachineFilter {
    locationId?: string;
    machineType?: MachineType;
    isActive?: boolean;
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
    minCutLength?: number;
    kerf?: number;
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
export declare class MachineRepository implements IMachineRepository {
    private readonly db;
    constructor(db: Database);
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
//# sourceMappingURL=machine.repository.d.ts.map