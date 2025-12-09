/**
 * Optimization Module Interfaces
 */

import { IResult } from './result.interface';

export interface IOptimizationService {
    createScenario(data: ICreateScenarioInput, userId: string): Promise<IResult<IScenarioDto>>;
    getScenarios(filter?: IScenarioFilter): Promise<IResult<IScenarioDto[]>>;
    getScenarioById(id: string): Promise<IResult<IScenarioDto>>;
    runOptimization(scenarioId: string): Promise<IResult<IOptimizationResultDto>>;
    getPlans(filter?: IPlanFilter): Promise<IResult<ICuttingPlanDto[]>>;
    getPlanById(id: string): Promise<IResult<ICuttingPlanDto>>;
    approvePlan(planId: string, userId: string, machineId?: string): Promise<IResult<ICuttingPlanDto>>;
    comparePlans(planIds: string[]): Promise<IResult<IPlanComparisonDto[]>>;
}

export interface IScenarioFilter {
    cuttingJobId?: string;
    status?: string;
}

export interface IPlanFilter {
    scenarioId?: string;
    status?: string;
}

export interface ICreateScenarioInput {
    name: string;
    cuttingJobId: string;
    parameters: IOptimizationParameters;
    useWarehouseStock?: boolean;
    useStandardSizes?: boolean;
    selectedStockIds?: string[];
}

export interface IOptimizationParameters {
    objectives?: IOptimizationObjectives;
    constraints?: IOptimizationConstraints;
}

export interface IOptimizationObjectives {
    minimizeWaste?: number;
    minimizeStockVariety?: number;
    minimizeSetupChanges?: number;
    minimizeProductionTime?: number;
}

export interface IOptimizationConstraints {
    algorithm?: string;
    kerf?: number;
    minUsableWaste?: number;
    allowRotation?: boolean;
    guillotineOnly?: boolean;
    allowedMachines?: string[];
}

export interface IScenarioDto {
    id: string;
    name: string;
    cuttingJobId: string;
    parameters: IOptimizationParameters;
    status: string;
    resultCount: number;
    createdAt: Date;
}

export interface IOptimizationResultDto {
    success: boolean;
    planId: string;
    planNumber: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    efficiency: number;
    unplacedCount: number;
}

export interface ICuttingPlanDto {
    id: string;
    planNumber: string;
    scenarioId: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime?: number;
    estimatedCost?: number;
    status: string;
    layoutItems: ICuttingLayoutDto[];
}

export interface ICuttingLayoutDto {
    id: string;
    stockItemId: string;
    sequence: number;
    waste: number;
    wastePercentage: number;
    layoutData: I1DLayoutData | I2DLayoutData;
}

export interface I1DLayoutData {
    type: '1D';
    stockLength: number;
    cuts: I1DCut[];
    usableWaste?: IUsableWaste1D;
}

export interface I1DCut {
    pieceId: string;
    position: number;
    length: number;
}

export interface IUsableWaste1D {
    position: number;
    length: number;
}

export interface I2DLayoutData {
    type: '2D';
    stockWidth: number;
    stockHeight: number;
    placements: I2DPlacement[];
}

export interface I2DPlacement {
    pieceId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
}

export interface IPlanComparisonDto {
    id: string;
    planNumber: string;
    scenarioName: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime?: number;
    estimatedCost?: number;
}
