/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 */
import { PrismaClient } from '@prisma/client';
export interface OptimizationInput {
    cuttingJobId: string;
    scenarioId: string;
    parameters: OptimizationParameters;
}
export interface OptimizationParameters {
    algorithm?: '1D_FFD' | '1D_BFD' | '2D_BOTTOM_LEFT' | '2D_GUILLOTINE';
    kerf?: number;
    minUsableWaste?: number;
    allowRotation?: boolean;
    useWarehouseStock?: boolean;
    selectedStockIds?: string[];
}
export interface OptimizationOutput {
    success: boolean;
    planData: PlanData;
    error?: string;
}
export interface PlanData {
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    efficiency: number;
    layouts: LayoutData[];
    unplacedCount: number;
}
export interface LayoutData {
    stockItemId: string;
    sequence: number;
    waste: number;
    wastePercentage: number;
    layoutJson: string;
}
export declare class OptimizationEngine {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    /**
     * Main entry point - runs optimization for a cutting job
     */
    runOptimization(input: OptimizationInput): Promise<OptimizationOutput>;
    private run1DOptimization;
    private convertTo1DPieces;
    private convertTo1DStock;
    private convert1DResult;
    private run2DOptimization;
    private convertTo2DPieces;
    private convertTo2DStock;
    private convert2DResult;
    private getCuttingJobWithItems;
    private getAvailableStock;
    private is1DJob;
    private emptyPlanData;
}
//# sourceMappingURL=optimization.engine.d.ts.map