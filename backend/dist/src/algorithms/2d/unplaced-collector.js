"use strict";
/**
 * 2D Unplaced Pieces Collector
 * Tracks pieces that couldn't be placed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnplacedCollector2D = void 0;
/**
 * Unplaced piece collector for 2D
 */
class UnplacedCollector2D {
    unplaced = new Map();
    add(piece) {
        const existing = this.unplaced.get(piece.originalId);
        if (existing) {
            existing.count++;
        }
        else {
            this.unplaced.set(piece.originalId, {
                piece: {
                    id: piece.originalId,
                    width: piece.width,
                    height: piece.height,
                    quantity: 1,
                    orderItemId: piece.orderItemId,
                    canRotate: piece.canRotate
                },
                count: 1
            });
        }
    }
    getAll() {
        return Array.from(this.unplaced.values()).map((entry) => ({
            ...entry.piece,
            quantity: entry.count
        }));
    }
    getCount() {
        return Array.from(this.unplaced.values()).reduce((sum, entry) => sum + entry.count, 0);
    }
    isEmpty() {
        return this.unplaced.size === 0;
    }
}
exports.UnplacedCollector2D = UnplacedCollector2D;
//# sourceMappingURL=unplaced-collector.js.map