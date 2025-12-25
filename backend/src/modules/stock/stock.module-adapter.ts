/**
 * Stock Module Adapter
 * Implements contract interface for external access
 * This is the public API surface of the Stock module
 */

import { IStockContract, IStockItemContract, IModuleHealth } from '../../core/contracts';
import { IStockRepository } from './stock.repository';
import { EventBus, DomainEvents, generateCorrelationId } from '../../core/events';

export class StockModuleAdapter implements IStockContract {
    readonly moduleName = 'stock';
    readonly version = '1.0.0';

    constructor(private readonly repository: IStockRepository) {}

    async getStockById(id: string): Promise<IStockItemContract | null> {
        const stock = await this.repository.findById(id);
        if (!stock) return null;

        return this.toContract(stock);
    }

    async getAvailableStock(materialTypeId: string, stockType: string): Promise<IStockItemContract[]> {
        const items = await this.repository.findAll({
            materialTypeId,
            stockType: stockType as 'BAR_1D' | 'SHEET_2D',
            minQuantity: 1
        });

        return items.map((item) => this.toContract(item));
    }

    async consumeStock(stockId: string, quantity: number, reason: string): Promise<void> {
        const eventBus = EventBus.getInstance();
        const correlationId = generateCorrelationId();

        // Publish consume request event
        await eventBus.publish(
            DomainEvents.stockConsumeRequested({
                stockItemId: stockId,
                quantity,
                reason,
                correlationId
            })
        );
    }

    async reserveStock(stockId: string, quantity: number, planId: string): Promise<void> {
        const eventBus = EventBus.getInstance();
        const correlationId = generateCorrelationId();

        // Publish reserve request event
        await eventBus.publish(
            DomainEvents.stockReserveRequested({
                stockItemId: stockId,
                quantity,
                planId,
                correlationId
            })
        );
    }

    /**
     * Health check for the module
     */
    async healthCheck(): Promise<IModuleHealth> {
        try {
            // Simple health check - try to query
            await this.repository.findAll({ minQuantity: 0 });
            return {
                module: this.moduleName,
                status: 'healthy',
                timestamp: new Date()
            };
        } catch (error) {
            console.debug('[STOCK] Health check failed:', error);
            return {
                module: this.moduleName,
                status: 'unhealthy',
                timestamp: new Date()
            };
        }
    }

    private toContract(stock: {
        id: string;
        code: string;
        name: string;
        materialTypeId: string;
        stockType: string;
        thickness: number;
        quantity: number;
        reservedQty: number;
        length?: number | null;
        width?: number | null;
        height?: number | null;
    }): IStockItemContract {
        return {
            id: stock.id,
            code: stock.code,
            name: stock.name,
            materialTypeId: stock.materialTypeId,
            stockType: stock.stockType as 'BAR_1D' | 'SHEET_2D',
            thickness: stock.thickness,
            quantity: stock.quantity,
            reservedQty: stock.reservedQty,
            length: stock.length ?? undefined,
            width: stock.width ?? undefined,
            height: stock.height ?? undefined
        };
    }
}
