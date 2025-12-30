"use strict";
/**
 * Stock Alert Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for low stock detection and alerts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAlertService = void 0;
const interfaces_1 = require("../../core/interfaces");
const stock_mapper_1 = require("./stock.mapper");
/**
 * Stock Alert Service Implementation
 */
class StockAlertService {
    stockRepository;
    constructor(stockRepository) {
        this.stockRepository = stockRepository;
    }
    /**
     * Check all stock items and generate low stock alerts
     */
    async checkAndNotifyLowStock() {
        try {
            const items = await this.stockRepository.findAll({});
            const alerts = [];
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
            return (0, interfaces_1.success)(alerts);
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_ALERT_ERROR',
                message: 'Stok uyarı kontrolü sırasında hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    /**
     * Get all low stock items based on threshold
     */
    async getLowStockItems(threshold = 5) {
        try {
            const items = await this.stockRepository.findAll({ minQuantity: threshold });
            const lowItems = items.filter((item) => item.quantity <= threshold);
            return (0, interfaces_1.success)(lowItems.map((item) => (0, stock_mapper_1.toStockItemDto)(item)));
        }
        catch (error) {
            return (0, interfaces_1.failure)({
                code: 'STOCK_FETCH_ERROR',
                message: 'Düşük stok kalemleri getirilirken hata oluştu',
                details: { error: (0, stock_mapper_1.getErrorMessage)(error) }
            });
        }
    }
    /**
     * Calculate alert level based on quantity
     */
    calculateAlertLevel(available) {
        if (available <= 0) {
            return 'OUT_OF_STOCK';
        }
        else if (available <= 2) {
            return 'CRITICAL';
        }
        return 'WARNING';
    }
}
exports.StockAlertService = StockAlertService;
//# sourceMappingURL=stock-alert.service.js.map