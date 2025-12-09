/**
 * Data Converter
 * Transforms data between layers
 * Following SRP - Only handles data transformation
 */
import { PrismaClient, CuttingJob, CuttingJobItem, OrderItem, StockItem } from '@prisma/client';
import { ICuttingJobData, ICuttingJobItemData, IStockItemData, IPlanData } from '../interfaces';
import { I1DPiece, I1DStock, I1DResult, I2DPiece, I2DStock, I2DResult } from '../interfaces';
type CuttingJobWithItems = CuttingJob & {
    items: (CuttingJobItem & {
        orderItem: OrderItem | null;
    })[];
};
export declare class JobToAlgorithmConverter {
    /**
     * Convert CuttingJob to algorithm-ready format
     */
    static toJobData(job: CuttingJobWithItems): ICuttingJobData;
    static toItemData(item: CuttingJobItem & {
        orderItem: OrderItem | null;
    }): ICuttingJobItemData;
    /**
     * Convert job items to 1D pieces
     */
    static to1DPieces(job: ICuttingJobData): I1DPiece[];
    /**
     * Convert job items to 2D pieces
     */
    static to2DPieces(job: ICuttingJobData): I2DPiece[];
}
export declare class StockToAlgorithmConverter {
    /**
     * Convert StockItem to algorithm-ready format
     */
    static toStockData(stock: StockItem): IStockItemData;
    /**
     * Convert stock items to 1D format
     */
    static to1DStock(stocks: StockItem[]): I1DStock[];
    /**
     * Convert stock items to 2D format
     */
    static to2DStock(stocks: StockItem[]): I2DStock[];
}
export declare class ResultToLayoutConverter {
    /**
     * Convert 1D result to plan data
     */
    static from1DResult(result: I1DResult): IPlanData;
    /**
     * Convert 2D result to plan data
     */
    static from2DResult(result: I2DResult): IPlanData;
}
export declare class DataLoader {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    loadCuttingJob(jobId: string): Promise<CuttingJobWithItems | null>;
    loadAvailableStock(materialTypeId: string, thickness: number, is1D: boolean, selectedIds?: string[]): Promise<StockItem[]>;
}
export {};
//# sourceMappingURL=data-converter.d.ts.map