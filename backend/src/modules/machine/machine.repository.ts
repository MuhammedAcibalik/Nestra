/**
 * Machine Repository
 * Migrated to Drizzle ORM
 */

import { Database } from '../../db';
import { machines, machineCompatibilities } from '../../db/schema';
import { MachineType } from '../../db/schema/enums';
import { eq, asc, and, or } from 'drizzle-orm';

// Type definitions
export type Machine = typeof machines.$inferSelect;
export type MachineCompatibility = typeof machineCompatibilities.$inferSelect;

// Re-export MachineType from schema enums for external use
export { MachineType } from '../../db/schema/enums';

export type MachineWithRelations = Machine & {
    compatibilities?: MachineCompatibility[];
    location?: { id: string; name: string } | null;
    _count?: { compatibilities: number; cuttingPlans: number };
};

export type CompatibilityWithRelations = MachineCompatibility & {
    materialType?: { id: string; name: string };
    thicknessRange?: { id: string; name: string } | null;
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

export class MachineRepository implements IMachineRepository {
    constructor(private readonly db: Database) { }

    async findById(id: string): Promise<MachineWithRelations | null> {
        const result = await this.db.query.machines.findFirst({
            where: eq(machines.id, id),
            with: {
                compatibilities: true,
                location: true
            }
        });
        return result ?? null;
    }

    async findAll(filter?: IMachineFilter): Promise<MachineWithRelations[]> {
        const conditions = [];

        if (filter?.locationId) conditions.push(eq(machines.locationId, filter.locationId));
        if (filter?.machineType) conditions.push(eq(machines.machineType, filter.machineType));
        if (filter?.isActive !== undefined) conditions.push(eq(machines.isActive, filter.isActive));

        return this.db.query.machines.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            with: {
                compatibilities: true,
                location: true
            },
            orderBy: [asc(machines.name)]
        });
    }

    async findByCode(code: string): Promise<Machine | null> {
        const result = await this.db.query.machines.findFirst({
            where: eq(machines.code, code)
        });
        return result ?? null;
    }

    async create(data: ICreateMachineInput): Promise<Machine> {
        const [result] = await this.db.insert(machines).values({
            code: data.code,
            name: data.name,
            description: data.description,
            machineType: data.machineType,
            maxLength: data.maxLength,
            maxWidth: data.maxWidth,
            maxHeight: data.maxHeight,
            minCutLength: data.minCutLength,
            kerf: data.kerf,
            onlyGuillotine: data.onlyGuillotine ?? false,
            locationId: data.locationId
        }).returning();
        return result;
    }

    async update(id: string, data: IUpdateMachineInput): Promise<Machine> {
        const [result] = await this.db.update(machines)
            .set({
                name: data.name,
                description: data.description,
                maxLength: data.maxLength,
                maxWidth: data.maxWidth,
                minCutLength: data.minCutLength,
                kerf: data.kerf,
                isActive: data.isActive,
                updatedAt: new Date()
            })
            .where(eq(machines.id, id))
            .returning();
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.db.delete(machines).where(eq(machines.id, id));
    }

    async addCompatibility(machineId: string, data: IAddCompatibilityInput): Promise<MachineCompatibility> {
        const [result] = await this.db.insert(machineCompatibilities).values({
            machineId,
            materialTypeId: data.materialTypeId,
            thicknessRangeId: data.thicknessRangeId,
            cuttingSpeed: data.cuttingSpeed,
            costPerUnit: data.costPerUnit
        }).returning();
        return result;
    }

    async getCompatibilities(machineId: string): Promise<CompatibilityWithRelations[]> {
        return this.db.query.machineCompatibilities.findMany({
            where: eq(machineCompatibilities.machineId, machineId),
            with: {
                materialType: true,
                thicknessRange: true
            }
        }) as Promise<CompatibilityWithRelations[]>;
    }

    async removeCompatibility(compatibilityId: string): Promise<void> {
        await this.db.delete(machineCompatibilities).where(eq(machineCompatibilities.id, compatibilityId));
    }

    async findCompatibleMachines(materialTypeId: string, thickness: number): Promise<MachineWithRelations[]> {
        // Find machines that have compatible material types
        const compatibleMachineIds = await this.db.select({ machineId: machineCompatibilities.machineId })
            .from(machineCompatibilities)
            .where(eq(machineCompatibilities.materialTypeId, materialTypeId));

        if (compatibleMachineIds.length === 0) return [];

        const ids = compatibleMachineIds.map(c => c.machineId);

        return this.db.query.machines.findMany({
            where: and(
                eq(machines.isActive, true),
                or(...ids.map(id => eq(machines.id, id)))
            ),
            with: {
                compatibilities: true,
                location: true
            }
        });
    }
}
