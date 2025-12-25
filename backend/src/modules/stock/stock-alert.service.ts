/**
 * Stock Alert Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for low stock detection and alerts
 */

import { IResult, success, failure, IStockItemDto, ILowStockAlert } from '../../core/interfaces';
import { IStockRepository } from './stock.repository';
import { toStockItemDto, getErrorMessage } from './stock.mapper';

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
export class StockAlertService implements IStockAlertService {
    constructor(private readonly stockRepository: IStockRepository) { }

    /**
     * Check all stock items and generate low stock alerts
     */
    async checkAndNotifyLowStock(): Promise<IResult<ILowStockAlert[]>> {
        try {
            const items = await this.stockRepository.findAll({});
            const alerts: ILowStockAlert[] = [];

            for (const item of items) {
                const availableQty = item.quantity - item.reservedQty;
                const minQuantity = 5; // Default threshold

                if (availableQty <= minQuantity) {
                    const alertLevel = this.calculateAlertLevel(availableQty);

                    alerts.push({
                        stockItemId: item.id,
                        stockCode: item.code,
                        stockName: item.name,
                        materialTypeName: item.materialType?.name ?? 'Unknown',
                        currentQuantity: item.quantity,
                        minQuantity,
                        alertLevel,
                        notifiedAt: new Date()
                    });
                }
            }

            // Sort by alert level (OUT_OF_STOCK first)
            const order = { OUT_OF_STOCK: 0, CRITICAL: 1, WARNING: 2 };
            alerts.sort((a, b) => order[a.alertLevel] - order[b.alertLevel]);

            return success(alerts);
        } catch (error) {
            return failure({
                code: 'STOCK_ALERT_ERROR',
                message: 'Stok uyarı kontrolü sırasında hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    /**
     * Get all low stock items based on threshold
     */
    async getLowStockItems(threshold = 5): Promise<IResult<IStockItemDto[]>> {
        try {
            const items = await this.stockRepository.findAll({ minQuantity: threshold });
            const lowItems = items.filter(item => item.quantity <= threshold);
            return success(lowItems.map(item => toStockItemDto(item)));
        } catch (error) {
            return failure({
                code: 'STOCK_FETCH_ERROR',
                message: 'Düşük stok kalemleri getirilirken hata oluştu',
                details: { error: getErrorMessage(error) }
            });
        }
    }

    /**
     * Calculate alert level based on quantity
     */
    private calculateAlertLevel(available: number): 'WARNING' | 'CRITICAL' | 'OUT_OF_STOCK' {
        if (available <= 0) {
            return 'OUT_OF_STOCK';
        } else if (available <= 2) {
            return 'CRITICAL';
        }
        return 'WARNING';
    }
}
