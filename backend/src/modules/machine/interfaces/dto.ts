/**
 * Machine DTOs
 * Data Transfer Objects for API layer
 */

import { MachineType } from '../../../db/schema/enums';

// Re-export MachineType for convenience
export { MachineType } from '../../../db/schema/enums';

/**
 * Machine DTO - Used for API responses
 */
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

/**
 * Compatibility DTO
 */
export interface ICompatibilityDto {
    id: string;
    materialType: { id: string; name: string };
    thicknessRange?: { id: string; name: string } | null;
    cuttingSpeed?: number;
    costPerUnit?: number;
}

/**
 * Machine filter for queries
 */
export interface IMachineFilter {
    locationId?: string;
    machineType?: MachineType;
    isActive?: boolean;
}

/**
 * Create machine input
 */
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

/**
 * Update machine input
 */
export interface IUpdateMachineInput {
    name?: string;
    description?: string;
    maxLength?: number;
    maxWidth?: number;
    minCutLength?: number;
    kerf?: number;
    isActive?: boolean;
}

/**
 * Add compatibility input
 */
export interface IAddCompatibilityInput {
    materialTypeId: string;
    thicknessRangeId?: string;
    cuttingSpeed?: number;
    costPerUnit?: number;
}
