"use strict";
/**
 * Data Converter
 * Transforms data between layers
 * Following SRP - Only handles data transformation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataLoader = exports.ResultToLayoutConverter = exports.StockToAlgorithmConverter = exports.JobToAlgorithmConverter = void 0;
// ==================== JOB CONVERTER ====================
class JobToAlgorithmConverter {
    /**
     * Convert CuttingJob to algorithm-ready format
     */
    static toJobData(job) {
        return {
            id: job.id,
            jobNumber: job.jobNumber,
            materialTypeId: job.materialTypeId,
            thickness: job.thickness,
            geometryType: job.geometryType,
            items: job.items.map(item => this.toItemData(item))
        };
    }
    static toItemData(item) {
        return {
            id: item.id,
            orderItemId: item.orderItemId ?? undefined,
            length: item.length ?? undefined,
            width: item.width ?? undefined,
            height: item.height ?? undefined,
            quantity: item.quantity,
            label: item.orderItem?.productName ?? undefined
        };
    }
    /**
     * Convert job items to 1D pieces
     */
    static to1DPieces(job) {
        return job.items.map(item => ({
            id: item.id,
            length: item.length ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId ?? ''
        }));
    }
    /**
     * Convert job items to 2D pieces
     */
    static to2DPieces(job) {
        return job.items.map(item => ({
            id: item.id,
            width: item.width ?? 0,
            height: item.height ?? 0,
            quantity: item.quantity,
            orderItemId: item.orderItemId ?? '',
            canRotate: true
        }));
    }
}
exports.JobToAlgorithmConverter = JobToAlgorithmConverter;
// ==================== STOCK CONVERTER ====================
class StockToAlgorithmConverter {
    /**
     * Convert StockItem to algorithm-ready format
     */
    static toStockData(stock) {
        return {
            id: stock.id,
            code: stock.code,
            stockType: stock.stockType,
            length: stock.length ?? undefined,
            width: stock.width ?? undefined,
            height: stock.height ?? undefined,
            quantity: stock.quantity,
            unitPrice: stock.unitPrice ?? undefined
        };
    }
    /**
     * Convert stock items to 1D format
     */
    static to1DStock(stocks) {
        return stocks
            .filter(s => s.stockType === 'BAR_1D')
            .map(s => ({
            id: s.id,
            length: s.length ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }
    /**
     * Convert stock items to 2D format
     */
    static to2DStock(stocks) {
        return stocks
            .filter(s => s.stockType === 'SHEET_2D')
            .map(s => ({
            id: s.id,
            width: s.width ?? 0,
            height: s.height ?? 0,
            available: s.quantity,
            unitPrice: s.unitPrice ?? undefined
        }));
    }
}
exports.StockToAlgorithmConverter = StockToAlgorithmConverter;
// ==================== RESULT CONVERTER ====================
class ResultToLayoutConverter {
    /**
     * Convert 1D result to plan data
     */
    static from1DResult(result) {
        const layouts = result.bars.map((bar, index) => ({
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
    /**
     * Convert 2D result to plan data
     */
    static from2DResult(result) {
        const layouts = result.sheets.map((sheet, index) => ({
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
}
exports.ResultToLayoutConverter = ResultToLayoutConverter;
// ==================== DATABASE LOADER ====================
class DataLoader {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async loadCuttingJob(jobId) {
        return this.prisma.cuttingJob.findUnique({
            where: { id: jobId },
            include: {
                items: {
                    include: { orderItem: true }
                }
            }
        });
    }
    async loadAvailableStock(materialTypeId, thickness, is1D, selectedIds) {
        const stockType = is1D ? 'BAR_1D' : 'SHEET_2D';
        const where = {
            materialTypeId,
            stockType,
            quantity: { gt: 0 }
        };
        if (thickness > 0) {
            where.thickness = thickness;
        }
        if (selectedIds && selectedIds.length > 0) {
            where.id = { in: selectedIds };
        }
        return this.prisma.stockItem.findMany({ where });
    }
}
exports.DataLoader = DataLoader;
//# sourceMappingURL=data-converter.js.map