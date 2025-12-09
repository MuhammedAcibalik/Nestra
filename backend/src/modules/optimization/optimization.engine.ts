/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 */

import { PrismaClient, StockItem, CuttingJob, CuttingJobItem, OrderItem } from '@prisma/client';
import {
    firstFitDecreasing,
    bestFitDecreasing,
    CuttingPiece1D,
    StockBar1D,
    Optimization1DResult,
    Optimization1DOptions
} from '../../algorithms/1d/cutting1d';
import {
    bottomLeftFill,
    guillotineCutting,
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DResult,
    Optimization2DOptions
} from '../../algorithms/2d/cutting2d';

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

// ==================== ENGINE CLASS ====================

export class OptimizationEngine {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Main entry point - runs optimization for a cutting job
     */
    async runOptimization(input: OptimizationInput): Promise<OptimizationOutput> {
        try {
            // 1. Get cutting job with items
            const cuttingJob = await this.getCuttingJobWithItems(input.cuttingJobId);
            if (!cuttingJob) {
                return { success: false, planData: this.emptyPlanData(), error: 'Cutting job not found' };
            }

            // 2. Determine if 1D or 2D based on geometry
            const is1D = this.is1DJob(cuttingJob);

            // 3. Get available stock
            const stock = await this.getAvailableStock(
                cuttingJob.materialTypeId,
                cuttingJob.thickness,
                is1D,
                input.parameters
            );

            if (stock.length === 0) {
                return { success: false, planData: this.emptyPlanData(), error: 'No available stock found' };
            }

            // 4. Run appropriate algorithm
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
        job: CuttingJobWithItems,
        stock: StockItem[],
        params: OptimizationParameters
    ): Promise<OptimizationOutput> {
        // Convert to algorithm format
        const pieces = this.convertTo1DPieces(job);
        const bars = this.convertTo1DStock(stock);

        const options: Optimization1DOptions = {
            algorithm: params.algorithm === '1D_BFD' ? 'BFD' : 'FFD',
            kerf: params.kerf ?? 3,
            minUsableWaste: params.minUsableWaste ?? 100
        };

        // Run algorithm
        const result = params.algorithm === '1D_BFD'
            ? bestFitDecreasing(pieces, bars, options)
            : firstFitDecreasing(pieces, bars, options);

        // Convert result to plan data
        return {
            success: result.success,
            planData: this.convert1DResult(result, stock)
        };
    }

    private convertTo1DPieces(job: CuttingJobWithItems): CuttingPiece1D[] {
        const pieces: CuttingPiece1D[] = [];

        for (const item of job.items) {
            if (item.orderItem?.length) {
                pieces.push({
                    id: item.orderItem.id,
                    length: item.orderItem.length,
                    quantity: item.quantity,
                    orderItemId: item.orderItemId
                });
            }
        }

        return pieces;
    }

    private convertTo1DStock(stock: StockItem[]): StockBar1D[] {
        return stock
            .filter(s => s.stockType === 'BAR_1D' && s.length)
            .map(s => ({
                id: s.id,
                length: s.length!,
                available: s.quantity - s.reservedQty,
                unitPrice: s.unitPrice ? Number(s.unitPrice) : undefined
            }));
    }

    private convert1DResult(result: Optimization1DResult, _stock: StockItem[]): PlanData {
        const layouts: LayoutData[] = result.bars.map((bar, index) => {
            return {
                stockItemId: bar.stockId,
                sequence: index + 1,
                waste: bar.waste,
                wastePercentage: bar.wastePercentage,
                layoutJson: JSON.stringify({
                    type: '1D',
                    stockLength: bar.stockLength,
                    cuts: bar.cuts,
                    usableWaste: bar.usableWaste
                })
            };
        });

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
        job: CuttingJobWithItems,
        stock: StockItem[],
        params: OptimizationParameters
    ): Promise<OptimizationOutput> {
        // Convert to algorithm format
        const pieces = this.convertTo2DPieces(job);
        const sheets = this.convertTo2DStock(stock);

        const options: Optimization2DOptions = {
            algorithm: params.algorithm === '2D_GUILLOTINE' ? 'GUILLOTINE' : 'BOTTOM_LEFT',
            kerf: params.kerf ?? 3,
            allowRotation: params.allowRotation ?? true,
            guillotineOnly: params.algorithm === '2D_GUILLOTINE'
        };

        // Run algorithm
        const result = params.algorithm === '2D_GUILLOTINE'
            ? guillotineCutting(pieces, sheets, options)
            : bottomLeftFill(pieces, sheets, options);

        // Convert result to plan data
        return {
            success: result.success,
            planData: this.convert2DResult(result, stock)
        };
    }

    private convertTo2DPieces(job: CuttingJobWithItems): CuttingPiece2D[] {
        const pieces: CuttingPiece2D[] = [];

        for (const item of job.items) {
            const orderItem = item.orderItem;
            if (orderItem?.width && orderItem?.height) {
                pieces.push({
                    id: orderItem.id,
                    width: orderItem.width,
                    height: orderItem.height,
                    quantity: item.quantity,
                    orderItemId: item.orderItemId,
                    canRotate: orderItem.canRotate
                });
            }
        }

        return pieces;
    }

    private convertTo2DStock(stock: StockItem[]): StockSheet2D[] {
        return stock
            .filter(s => s.stockType === 'SHEET_2D' && s.width && s.height)
            .map(s => ({
                id: s.id,
                width: s.width!,
                height: s.height!,
                available: s.quantity - s.reservedQty,
                unitPrice: s.unitPrice ? Number(s.unitPrice) : undefined
            }));
    }

    private convert2DResult(result: Optimization2DResult, _stock: StockItem[]): PlanData {
        const layouts: LayoutData[] = result.sheets.map((sheet, index) => {
            return {
                stockItemId: sheet.stockId,
                sequence: index + 1,
                waste: sheet.wasteArea,
                wastePercentage: sheet.wastePercentage,
                layoutJson: JSON.stringify({
                    type: '2D',
                    stockWidth: sheet.stockWidth,
                    stockHeight: sheet.stockHeight,
                    placements: sheet.placements
                })
            };
        });

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

    private async getCuttingJobWithItems(jobId: string): Promise<CuttingJobWithItems | null> {
        return this.prisma.cuttingJob.findUnique({
            where: { id: jobId },
            include: {
                items: {
                    include: {
                        orderItem: true
                    }
                }
            }
        });
    }

    private async getAvailableStock(
        materialTypeId: string,
        thickness: number,
        is1D: boolean,
        params: OptimizationParameters
    ): Promise<StockItem[]> {
        const where: {
            materialTypeId: string;
            thickness: number;
            stockType: 'BAR_1D' | 'SHEET_2D';
            id?: { in: string[] };
        } = {
            materialTypeId,
            thickness,
            stockType: is1D ? 'BAR_1D' : 'SHEET_2D'
        };

        // If specific stock IDs are selected, filter by them
        if (params.selectedStockIds && params.selectedStockIds.length > 0) {
            where.id = { in: params.selectedStockIds };
        }

        return this.prisma.stockItem.findMany({
            where,
            orderBy: [
                { unitPrice: 'asc' },
                { quantity: 'desc' }
            ]
        });
    }

    private is1DJob(job: CuttingJobWithItems): boolean {
        // Check first item's geometry type
        if (job.items.length === 0) return true;

        const firstItem = job.items[0]?.orderItem;
        if (!firstItem) return true;

        return firstItem.geometryType === 'BAR_1D';
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

// ==================== TYPES ====================

type CuttingJobWithItems = CuttingJob & {
    items: (CuttingJobItem & {
        orderItem: OrderItem | null;
    })[];
};
