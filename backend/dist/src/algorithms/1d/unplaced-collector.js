"use strict";
/**
 * 1D Unplaced Pieces Collector
 * Tracks pieces that couldn't be placed
 * Single Responsibility: Only handles unplaced piece aggregation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnplacedCollector1D = void 0;
/**
 * Unplaced piece collector
 * Groups expanded pieces back by originalId with quantity
 */
class UnplacedCollector1D {
    unplaced = new Map();
    /**
     * Add an unplaced piece
     */
    add(piece) {
        const existing = this.unplaced.get(piece.originalId);
        if (existing) {
            existing.count++;
        }
        else {
            this.unplaced.set(piece.originalId, {
                piece: {
                    id: piece.originalId,
                    length: piece.length,
                    quantity: 1,
                    orderItemId: piece.orderItemId
                },
                count: 1
            });
        }
    }
    /**
     * Get all unplaced pieces with aggregated quantities
     */
    getAll() {
        return Array.from(this.unplaced.values()).map((entry) => ({
            ...entry.piece,
            quantity: entry.count
        }));
    }
    /**
     * Get count of unplaced pieces
     */
    getCount() {
        return Array.from(this.unplaced.values()).reduce((sum, entry) => sum + entry.count, 0);
    }
    /**
     * Check if there are any unplaced pieces
     */
    isEmpty() {
        return this.unplaced.size === 0;
    }
}
exports.UnplacedCollector1D = UnplacedCollector1D;
//# sourceMappingURL=unplaced-collector.js.map