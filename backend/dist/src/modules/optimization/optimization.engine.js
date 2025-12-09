"use strict";
/**
 * Optimization Engine
 * Bridge layer between cutting algorithms and database
 * Following SRP - Only handles algorithm execution and data transformation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationEngine = void 0;
const cutting1d_1 = require("../../algorithms/1d/cutting1d");
const cutting2d_1 = require("../../algorithms/2d/cutting2d");
// ==================== ENGINE CLASS ====================
class OptimizationEngine {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Main entry point - runs optimization for a cutting job
     */
    async runOptimization(input) {
        try {
            // 1. Get cutting job with items
            const cuttingJob = await this.getCuttingJobWithItems(input.cuttingJobId);
            if (!cuttingJob) {
                return { success: false, planData: this.emptyPlanData(), error: 'Cutting job not found' };
            }
            // 2. Determine if 1D or 2D based on geometry
            const is1D = this.is1DJob(cuttingJob);
            // 3. Get available stock
            const stock = await this.getAvailableStock(cuttingJob.materialTypeId, cuttingJob.thickness, is1D, input.parameters);
            if (stock.length === 0) {
                return { success: false, planData: this.emptyPlanData(), error: 'No available stock found' };
            }
            // 4. Run appropriate algorithm
            if (is1D) {
                return this.run1DOptimization(cuttingJob, stock, input.parameters);
            }
            else {
                return this.run2DOptimization(cuttingJob, stock, input.parameters);
            }
        }
        catch (error) {
            return {
                success: false,
                planData: this.emptyPlanData(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // ==================== 1D OPTIMIZATION ====================
    async run1DOptimization(job, stock, params) {
        // Convert to algorithm format
        const pieces = this.convertTo1DPieces(job);
        const bars = this.convertTo1DStock(stock);
        const options = {
            algorithm: params.algorithm === '1D_BFD' ? 'BFD' : 'FFD',
            kerf: params.kerf ?? 3,
            minUsableWaste: params.minUsableWaste ?? 100
        };
        // Run algorithm
        const result = params.algorithm === '1D_BFD'
            ? (0, cutting1d_1.bestFitDecreasing)(pieces, bars, options)
            : (0, cutting1d_1.firstFitDecreasing)(pieces, bars, options);
        // Convert result to plan data
        return {
            success: result.success,
            planData: this.convert1DResult(result, stock)
        };
    }
    convertTo1DPieces(job) {
        const pieces = [];
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
    convertTo1DStock(stock) {
        return stock
            .filter(s => s.stockType === 'BAR_1D' && s.length)
            .map(s => ({
            id: s.id,
            length: s.length,
            available: s.quantity - s.reservedQty,
            unitPrice: s.unitPrice ? Number(s.unitPrice) : undefined
        }));
    }
    convert1DResult(result, _stock) {
        const layouts = result.bars.map((bar, index) => {
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
    async run2DOptimization(job, stock, params) {
        // Convert to algorithm format
        const pieces = this.convertTo2DPieces(job);
        const sheets = this.convertTo2DStock(stock);
        const options = {
            algorithm: params.algorithm === '2D_GUILLOTINE' ? 'GUILLOTINE' : 'BOTTOM_LEFT',
            kerf: params.kerf ?? 3,
            allowRotation: params.allowRotation ?? true,
            guillotineOnly: params.algorithm === '2D_GUILLOTINE'
        };
        // Run algorithm
        const result = params.algorithm === '2D_GUILLOTINE'
            ? (0, cutting2d_1.guillotineCutting)(pieces, sheets, options)
            : (0, cutting2d_1.bottomLeftFill)(pieces, sheets, options);
        // Convert result to plan data
        return {
            success: result.success,
            planData: this.convert2DResult(result, stock)
        };
    }
    convertTo2DPieces(job) {
        const pieces = [];
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
    convertTo2DStock(stock) {
        return stock
            .filter(s => s.stockType === 'SHEET_2D' && s.width && s.height)
            .map(s => ({
            id: s.id,
            width: s.width,
            height: s.height,
            available: s.quantity - s.reservedQty,
            unitPrice: s.unitPrice ? Number(s.unitPrice) : undefined
        }));
    }
    convert2DResult(result, _stock) {
        const layouts = result.sheets.map((sheet, index) => {
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
    async getCuttingJobWithItems(jobId) {
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
    async getAvailableStock(materialTypeId, thickness, is1D, params) {
        const where = {
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
    is1DJob(job) {
        // Check first item's geometry type
        if (job.items.length === 0)
            return true;
        const firstItem = job.items[0]?.orderItem;
        if (!firstItem)
            return true;
        return firstItem.geometryType === 'BAR_1D';
    }
    emptyPlanData() {
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
exports.OptimizationEngine = OptimizationEngine;
//# sourceMappingURL=optimization.engine.js.map