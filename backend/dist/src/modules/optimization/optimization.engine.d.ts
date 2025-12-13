/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 * Following DIP - Uses service clients instead of direct database access
 *
 * NOW WITH PISCINA WORKER THREADS:
 * - Data fetching: Main thread (async I/O)
 * - Algorithm execution: Piscina pool (CPU-intensive)
 */
import { ICuttingJobServiceClient, IStockQueryClient } from '../../core/services';
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
export interface IOptimizationEngineConfig {
    useWorkerThreads?: boolean;
}
export declare class OptimizationEngine {
    private readonly cuttingJobClient;
    private readonly stockQueryClient;
    private pool;
    private readonly useWorkerThreads;
    constructor(cuttingJobClient: ICuttingJobServiceClient, stockQueryClient: IStockQueryClient, config?: IOptimizationEngineConfig);
    /**
     * Initialize Piscina pool (call once at startup)
     */
    initializeWorkers(): Promise<void>;
    /**
     * Main entry point - runs optimization for a cutting job
     */
    runOptimization(input: OptimizationInput): Promise<OptimizationOutput>;
    /**
     * Get pool statistics
     */
    getPoolStats(): import("../../workers").IOptimizationPoolStats | null;
    private run1DOptimization;
    private run1DSync;
    private convertTo1DPieces;
    private convertTo1DStock;
    private convert1DResult;
    private run2DOptimization;
    private run2DSync;
    private convertTo2DPieces;
    private convertTo2DStock;
    private convert2DResult;
    private getCuttingJobWithItems;
    private getAvailableStock;
    private is1DJob;
    private emptyPlanData;
}
//# sourceMappingURL=optimization.engine.d.ts.map