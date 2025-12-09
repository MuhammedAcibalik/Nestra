/**
 * DTO Interfaces
 * Data Transfer Objects for API responses
 */
export interface IScenarioDto {
    id: string;
    name: string;
    cuttingJobId: string;
    cuttingJobNumber?: string;
    status: string;
    parameters: object;
    resultCount: number;
    createdBy?: string;
    createdAt: Date;
}
export interface ICreateScenarioDto {
    name: string;
    cuttingJobId: string;
    parameters?: object;
    useWarehouseStock?: boolean;
    useStandardSizes?: boolean;
    selectedStockIds?: string[];
}
export interface ICuttingPlanDto {
    id: string;
    planNumber: string;
    scenarioId: string;
    scenarioName?: string;
    status: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime?: number;
    estimatedCost?: number;
    layouts: ICuttingLayoutDto[];
    assignedMachine?: {
        id: string;
        name: string;
        code: string;
    };
    approvedBy?: string;
    approvedAt?: Date;
    createdAt: Date;
}
export interface ICuttingLayoutDto {
    id: string;
    sequence: number;
    stockItemId: string;
    waste: number;
    wastePercentage: number;
    layoutData: I1DLayoutData | I2DLayoutData;
}
export interface I1DLayoutData {
    type: '1D';
    stockLength: number;
    cuts: {
        pieceId: string;
        position: number;
        length: number;
    }[];
    usableWaste?: {
        position: number;
        length: number;
    };
}
export interface I2DLayoutData {
    type: '2D';
    stockWidth: number;
    stockHeight: number;
    placements: {
        pieceId: string;
        x: number;
        y: number;
        width: number;
        height: number;
        rotated: boolean;
    }[];
}
export interface IOptimizationResultDto {
    success: boolean;
    planId?: string;
    planNumber?: string;
    wastePercentage?: number;
    efficiency?: number;
    stockUsed?: number;
    unplacedCount?: number;
    executionTimeMs?: number;
    error?: string;
}
export interface IPlanComparisonDto {
    planId: string;
    planNumber: string;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedCost?: number;
    efficiency: number;
    rank: number;
}
export interface IScenarioFilterDto {
    cuttingJobId?: string;
    status?: string;
}
export interface IPlanFilterDto {
    scenarioId?: string;
    status?: string;
}
//# sourceMappingURL=dto.interfaces.d.ts.map