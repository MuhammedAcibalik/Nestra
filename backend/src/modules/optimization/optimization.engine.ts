/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 * Following DIP - Uses service clients instead of direct database access
 * 
 * NOW WITH WORKER THREADS:
 * - Data fetching: Main thread (async I/O)
 * - Algorithm execution: Worker thread (CPU-intensive)
 */

import {
    CuttingPiece1D,
    StockBar1D,
    Optimization1DResult,
    Optimization1DOptions,
    BarCuttingResult,
    firstFitDecreasing,
    bestFitDecreasing
} from '../../algorithms/1d/cutting1d';
import {
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DResult,
    Optimization2DOptions,
    SheetCuttingResult,
    bottomLeftFill,
    guillotineCutting
} from '../../algorithms/2d/cutting2d';
import {
    ICuttingJobServiceClient,
    IStockQueryClient,
    ICuttingJobWithItems,
    IStockItemForOptimization
} from '../../core/services';
import {
    WorkerPool,
    getOptimizationWorkerPool,
    createTask,
    IOptimization1DPayload,
    IOptimization2DPayload
} from '../../workers';

// ==================== INTERFACES ====================

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

// ==================== ENGINE CLASS ====================

export class OptimizationEngine {
    private workerPool: WorkerPool | null = null;
    private readonly useWorkerThreads: boolean;

    constructor(
        private readonly cuttingJobClient: ICuttingJobServiceClient,
        private readonly stockQueryClient: IStockQueryClient,
        config?: IOptimizationEngineConfig
    ) {
        this.useWorkerThreads = config?.useWorkerThreads ?? true;
    }

    /**
     * Initialize worker pool (call once at startup)
     */
    async initializeWorkers(): Promise<void> {
        if (this.useWorkerThreads && !this.workerPool) {
            this.workerPool = getOptimizationWorkerPool();
            await this.workerPool.initialize();
            console.log('[OPTIMIZATION ENGINE] Worker pool initialized');
        }
    }

    /**
     * Main entry point - runs optimization for a cutting job
     */
    async runOptimization(input: OptimizationInput): Promise<OptimizationOutput> {
        try {
            // 1. Get cutting job with items via service client (MAIN THREAD - async I/O)
            const cuttingJob = await this.getCuttingJobWithItems(input.cuttingJobId);
            if (!cuttingJob) {
                return { success: false, planData: this.emptyPlanData(), error: 'Cutting job not found' };
            }

            // 2. Determine if 1D or 2D based on geometry
            const is1D = this.is1DJob(cuttingJob);

            // 3. Get available stock via service client (MAIN THREAD - async I/O)
            const stock = await this.getAvailableStock(
                cuttingJob.materialTypeId,
                cuttingJob.thickness,
                is1D,
                input.parameters
            );

            if (stock.length === 0) {
                return { success: false, planData: this.emptyPlanData(), error: 'No available stock found' };
            }

            // 4. Run appropriate algorithm (WORKER THREAD or FALLBACK)
            if (is1D) {
                return this.run1DOptimization(cuttingJob, stock, input.parameters);
            } else {
                return this.run2DOptimization(cuttingJob, stock, input.parameters);
            }
        } catch (error) {
            return {
                success: false,
                planData: this.emptyPlanData(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // ==================== 1D OPTIMIZATION ====================

    private async run1DOptimization(
        job: ICuttingJobWithItems,
        stock: IStockItemForOptimization[],
        params: OptimizationParameters
    ): Promise<OptimizationOutput> {
        const pieces = this.convertTo1DPieces(job);
        const bars = this.convertTo1DStock(stock);

        const options: Optimization1DOptions = {
            algorithm: params.algorithm === '1D_BFD' ? 'BFD' : 'FFD',
            kerf: params.kerf ?? 3,
            minUsableWaste: params.minUsableWaste ?? 100
        };

        let result: Optimization1DResult;

        // Try worker thread first, fallback to main thread
        if (this.workerPool && this.useWorkerThreads) {
            try {
                result = await this.execute1DInWorker(pieces, bars, options);
            } catch (error) {
                console.warn('[OPTIMIZATION ENGINE] Worker failed, falling back to main thread:', error);
                result = this.run1DSync(pieces, bars, options);
            }
        } else {
            result = this.run1DSync(pieces, bars, options);
        }

        return {
            success: true,
            planData: this.convert1DResult(result, stock)
        };
    }

    private async execute1DInWorker(
        pieces: CuttingPiece1D[],
        bars: StockBar1D[],
        options: Optimization1DOptions
    ): Promise<Optimization1DResult> {
        const payload: IOptimization1DPayload = { pieces, stockBars: bars, options };
        const task = createTask('OPTIMIZATION_1D', payload);

        const result = await this.workerPool!.execute<IOptimization1DPayload, Optimization1DResult>(task);

        if (!result.success || !result.result) {
            throw new Error(result.error ?? 'Worker returned no result');
        }

        console.log(`[OPTIMIZATION ENGINE] 1D completed in worker (${result.executionTime}ms)`);
        return result.result;
    }

    private run1DSync(pieces: CuttingPiece1D[], bars: StockBar1D[], options: Optimization1DOptions): Optimization1DResult {
        if (options.algorithm === 'BFD') {
            return bestFitDecreasing(pieces, bars, options);
        }
        return firstFitDecreasing(pieces, bars, options);
    }

    private convertTo1DPieces(job: ICuttingJobWithItems): CuttingPiece1D[] {
        return job.items.map(item => ({
            id: item.id,
            length: item.orderItem?.length ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId,
            canRotate: false
        }));
    }

    private convertTo1DStock(stock: IStockItemForOptimization[]): StockBar1D[] {
        return stock.map(s => ({
            id: s.id,
            length: s.length ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }

    private convert1DResult(result: Optimization1DResult, _stock: IStockItemForOptimization[]): PlanData {
        const layouts: LayoutData[] = result.bars.map((bar: BarCuttingResult, i: number) => ({
            stockItemId: bar.stockId,
            sequence: i + 1,
            waste: bar.waste,
            wastePercentage: bar.wastePercentage,
            layoutJson: JSON.stringify({
                barId: bar.stockId,
                barLength: bar.stockLength,
                cuts: bar.cuts,
                waste: bar.waste
            })
        }));

        return {
            totalWaste: result.totalWaste,
            wastePercentage: result.totalWastePercentage,
            stockUsedCount: result.stockUsedCount,
            efficiency: result.statistics.efficiency,
            layouts,
            unplacedCount: result.unplacedPieces.length
        };
    }

    // ==================== 2D OPTIMIZATION ====================

    private async run2DOptimization(
        job: ICuttingJobWithItems,
        stock: IStockItemForOptimization[],
        params: OptimizationParameters
    ): Promise<OptimizationOutput> {
        const pieces = this.convertTo2DPieces(job, params.allowRotation ?? true);
        const sheets = this.convertTo2DStock(stock);

        const options: Optimization2DOptions = {
            algorithm: params.algorithm === '2D_GUILLOTINE' ? 'GUILLOTINE' : 'BOTTOM_LEFT',
            kerf: params.kerf ?? 3,
            allowRotation: params.allowRotation ?? true,
            guillotineOnly: params.algorithm === '2D_GUILLOTINE'
        };

        let result: Optimization2DResult;

        // Try worker thread first, fallback to main thread
        if (this.workerPool && this.useWorkerThreads) {
            try {
                result = await this.execute2DInWorker(pieces, sheets, options);
            } catch (error) {
                console.warn('[OPTIMIZATION ENGINE] Worker failed, falling back to main thread:', error);
                result = this.run2DSync(pieces, sheets, options);
            }
        } else {
            result = this.run2DSync(pieces, sheets, options);
        }

        return {
            success: true,
            planData: this.convert2DResult(result, stock)
        };
    }

    private async execute2DInWorker(
        pieces: CuttingPiece2D[],
        sheets: StockSheet2D[],
        options: Optimization2DOptions
    ): Promise<Optimization2DResult> {
        const payload: IOptimization2DPayload = { pieces, stockSheets: sheets, options };
        const task = createTask('OPTIMIZATION_2D', payload);

        const result = await this.workerPool!.execute<IOptimization2DPayload, Optimization2DResult>(task);

        if (!result.success || !result.result) {
            throw new Error(result.error ?? 'Worker returned no result');
        }

        console.log(`[OPTIMIZATION ENGINE] 2D completed in worker (${result.executionTime}ms)`);
        return result.result;
    }

    private run2DSync(pieces: CuttingPiece2D[], sheets: StockSheet2D[], options: Optimization2DOptions): Optimization2DResult {
        if (options.algorithm === 'GUILLOTINE') {
            return guillotineCutting(pieces, sheets, options);
        }
        return bottomLeftFill(pieces, sheets, options);
    }

    private convertTo2DPieces(job: ICuttingJobWithItems, allowRotation: boolean): CuttingPiece2D[] {
        return job.items.map(item => ({
            id: item.id,
            width: item.orderItem?.width ?? 0,
            height: item.orderItem?.height ?? item.orderItem?.length ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId,
            canRotate: allowRotation
        }));
    }

    private convertTo2DStock(stock: IStockItemForOptimization[]): StockSheet2D[] {
        return stock.map(s => ({
            id: s.id,
            width: s.width ?? 0,
            height: s.height ?? s.length ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }

    private convert2DResult(result: Optimization2DResult, _stock: IStockItemForOptimization[]): PlanData {
        const layouts: LayoutData[] = result.sheets.map((sheet: SheetCuttingResult, i: number) => ({
            stockItemId: sheet.stockId,
            sequence: i + 1,
            waste: sheet.wasteArea,
            wastePercentage: sheet.wastePercentage,
            layoutJson: JSON.stringify({
                sheetId: sheet.stockId,
                placements: sheet.placements,
                wasteArea: sheet.wasteArea
            })
        }));

        return {
            totalWaste: result.totalWasteArea,
            wastePercentage: result.totalWastePercentage,
            stockUsedCount: result.stockUsedCount,
            efficiency: result.statistics.efficiency,
            layouts,
            unplacedCount: result.unplacedPieces.length
        };
    }

    // ==================== HELPER METHODS ====================

    private async getCuttingJobWithItems(jobId: string): Promise<ICuttingJobWithItems | null> {
        const response = await this.cuttingJobClient.getJobWithItems(jobId);
        if (!response.success || !response.data) {
            return null;
        }
        return response.data;
    }

    private async getAvailableStock(
        materialTypeId: string,
        thickness: number,
        is1D: boolean,
        params: OptimizationParameters
    ): Promise<IStockItemForOptimization[]> {
        const response = await this.stockQueryClient.getAvailableStock({
            materialTypeId,
            thickness,
            stockType: is1D ? 'BAR_1D' : 'SHEET_2D',
            selectedStockIds: params.selectedStockIds
        });

        if (!response.success || !response.data) {
            return [];
        }
        return response.data;
    }

    private is1DJob(job: ICuttingJobWithItems): boolean {
        // Check first item's geometry type
        if (job.items.length === 0) return true;
        const firstItem = job.items[0];
        if (!firstItem.orderItem) return true;
        return firstItem.orderItem.geometryType === 'BAR_1D';
    }

    private emptyPlanData(): PlanData {
        return {
            totalWaste: 0,
            wastePercentage: 0,
            stockUsedCount: 0,
            efficiency: 0,
            layouts: [],
            unplacedCount: 0
        };
    }
}
