/**
 * Stock Manager
 * Manages stock availability and selection
 * Single Responsibility: Only handles stock state management
 */

// ==================== INTERFACES ====================

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
 * Stock usage entry
 */
interface StockUsageEntry {
    remaining: number;
}

// ==================== 1D STOCK MANAGER ====================

/**
 * 1D Stock Manager
 * Tracks available stock and provides selection logic
 */
export class Stock1DManager {
    private readonly sortedStock: readonly I1DStockInput[];
    private readonly usage: Map<string, StockUsageEntry>;

    constructor(stock: readonly I1DStockInput[], sortStrategy: 'DESC' | 'ASC' = 'DESC') {
        // Filter available stock and sort
        const filtered = stock.filter(s => s.available > 0);
        this.sortedStock = sortStrategy === 'DESC'
            ? [...filtered].sort((a, b) => b.length - a.length)
            : [...filtered].sort((a, b) => a.length - b.length);

        // Initialize usage tracking
        this.usage = new Map();
        for (const s of this.sortedStock) {
            this.usage.set(s.id, { remaining: s.available });
        }
    }

    /**
     * Find stock that can fit the given length
     */
    findAvailableStock(requiredLength: number): I1DStockInput | null {
        for (const stock of this.sortedStock) {
            const entry = this.usage.get(stock.id);
            if (entry && entry.remaining > 0 && stock.length >= requiredLength) {
                return stock;
            }
        }
        return null;
    }

    /**
     * Consume one unit of stock
     */
    consumeStock(stockId: string): void {
        const entry = this.usage.get(stockId);
        if (entry && entry.remaining > 0) {
            entry.remaining--;
        }
    }

    /**
     * Get remaining count for stock
     */
    getRemaining(stockId: string): number {
        return this.usage.get(stockId)?.remaining ?? 0;
    }
}

// ==================== 2D STOCK MANAGER ====================

/**
 * 2D Stock Manager
 * Tracks available stock sheets
 */
export class Stock2DManager {
    private readonly sortedStock: readonly I2DStockInput[];
    private readonly usage: Map<string, StockUsageEntry>;

    constructor(stock: readonly I2DStockInput[]) {
        // Filter and sort by area (descending)
        this.sortedStock = [...stock]
            .filter(s => s.available > 0)
            .sort((a, b) => (b.width * b.height) - (a.width * a.height));

        // Initialize usage tracking
        this.usage = new Map();
        for (const s of this.sortedStock) {
            this.usage.set(s.id, { remaining: s.available });
        }
    }

    /**
     * Find stock that can fit the given dimensions
     */
    findAvailableStock(width: number, height: number): I2DStockInput | null {
        for (const stock of this.sortedStock) {
            const entry = this.usage.get(stock.id);
            if (entry && entry.remaining > 0) {
                // Check both orientations
                if ((stock.width >= width && stock.height >= height) ||
                    (stock.width >= height && stock.height >= width)) {
                    return stock;
                }
            }
        }
        return null;
    }

    /**
     * Consume one unit of stock
     */
    consumeStock(stockId: string): void {
        const entry = this.usage.get(stockId);
        if (entry && entry.remaining > 0) {
            entry.remaining--;
        }
    }

    /**
     * Get all available stock
     */
    getAvailableStock(): readonly I2DStockInput[] {
        return this.sortedStock.filter(s => {
            const entry = this.usage.get(s.id);
            return entry && entry.remaining > 0;
        });
    }
}
