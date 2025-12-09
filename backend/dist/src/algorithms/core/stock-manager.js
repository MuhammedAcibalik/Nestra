"use strict";
/**
 * Stock Manager
 * Manages stock availability and selection
 * Single Responsibility: Only handles stock state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stock2DManager = exports.Stock1DManager = void 0;
// ==================== 1D STOCK MANAGER ====================
/**
 * 1D Stock Manager
 * Tracks available stock and provides selection logic
 */
class Stock1DManager {
    sortedStock;
    usage;
    constructor(stock, sortStrategy = 'DESC') {
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
    findAvailableStock(requiredLength) {
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
    consumeStock(stockId) {
        const entry = this.usage.get(stockId);
        if (entry && entry.remaining > 0) {
            entry.remaining--;
        }
    }
    /**
     * Get remaining count for stock
     */
    getRemaining(stockId) {
        return this.usage.get(stockId)?.remaining ?? 0;
    }
}
exports.Stock1DManager = Stock1DManager;
// ==================== 2D STOCK MANAGER ====================
/**
 * 2D Stock Manager
 * Tracks available stock sheets
 */
class Stock2DManager {
    sortedStock;
    usage;
    constructor(stock) {
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
    findAvailableStock(width, height) {
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
    consumeStock(stockId) {
        const entry = this.usage.get(stockId);
        if (entry && entry.remaining > 0) {
            entry.remaining--;
        }
    }
    /**
     * Get all available stock
     */
    getAvailableStock() {
        return this.sortedStock.filter(s => {
            const entry = this.usage.get(s.id);
            return entry && entry.remaining > 0;
        });
    }
}
exports.Stock2DManager = Stock2DManager;
//# sourceMappingURL=stock-manager.js.map