/**
 * Stock Alert Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for low stock detection and alerts
 */
import { IResult, IStockItemDto, ILowStockAlert } from '../../core/interfaces';
import { IStockRepository } from './stock.repository';
/**
 * Stock Alert Service Interface
 */
export interface IStockAlertService {
    checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>>;
    getLowStockItems(threshold?: number): Promise<IResult<IStockItemDto[]>>;
}
/**
 * Stock Alert Service Implementation
 */
export declare class StockAlertService implements IStockAlertService {
    private readonly stockRepository;
    constructor(stockRepository: IStockRepository);
    /**
     * Check all stock items and generate low stock alerts
     */
    checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>>;
    /**
     * Get all low stock items based on threshold
     */
    getLowStockItems(threshold?: number): Promise<IResult<IStockItemDto[]>>;
    /**
     * Calculate alert level based on quantity
     */
    private calculateAlertLevel;
}
//# sourceMappingURL=stock-alert.service.d.ts.map