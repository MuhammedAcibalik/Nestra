/**
 * Stock Module Adapter
 * Implements contract interface for external access
 * This is the public API surface of the Stock module
 */
import { IStockContract, IStockItemContract, IModuleHealth } from '../../core/contracts';
import { IStockRepository } from './stock.repository';
export declare class StockModuleAdapter implements IStockContract {
    private readonly repository;
    readonly moduleName = "stock";
    readonly version = "1.0.0";
    constructor(repository: IStockRepository);
    getStockById(id: string): Promise<IStockItemContract | null>;
    getAvailableStock(materialTypeId: string, stockType: string): Promise<IStockItemContract[]>;
    consumeStock(stockId: string, quantity: number, reason: string): Promise<void>;
    reserveStock(stockId: string, quantity: number, planId: string): Promise<void>;
    /**
     * Health check for the module
     */
    healthCheck(): Promise<IModuleHealth>;
    private toContract;
}
//# sourceMappingURL=stock.module-adapter.d.ts.map