/**
 * Stock Manager
 * Manages stock availability and selection
 * Single Responsibility: Only handles stock state management
 */
/**
 * 1D Stock item
 */
export interface I1DStockInput {
    readonly id: string;
    readonly length: number;
    readonly available: number;
    readonly unitPrice?: number;
}
/**
 * 2D Stock item
 */
export interface I2DStockInput {
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly available: number;
    readonly unitPrice?: number;
}
/**
 * 1D Stock Manager
 * Tracks available stock and provides selection logic
 */
export declare class Stock1DManager {
    private readonly sortedStock;
    private readonly usage;
    constructor(stock: readonly I1DStockInput[], sortStrategy?: 'DESC' | 'ASC');
    /**
     * Find stock that can fit the given length
     */
    findAvailableStock(requiredLength: number): I1DStockInput | null;
    /**
     * Consume one unit of stock
     */
    consumeStock(stockId: string): void;
    /**
     * Get remaining count for stock
     */
    getRemaining(stockId: string): number;
}
/**
 * 2D Stock Manager
 * Tracks available stock sheets
 */
export declare class Stock2DManager {
    private readonly sortedStock;
    private readonly usage;
    constructor(stock: readonly I2DStockInput[]);
    /**
     * Find stock that can fit the given dimensions
     */
    findAvailableStock(width: number, height: number): I2DStockInput | null;
    /**
     * Consume one unit of stock
     */
    consumeStock(stockId: string): void;
    /**
     * Get all available stock
     */
    getAvailableStock(): readonly I2DStockInput[];
}
//# sourceMappingURL=stock-manager.d.ts.map