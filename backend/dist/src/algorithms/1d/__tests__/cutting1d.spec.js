"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cutting1d_1 = require("../cutting1d");
describe('1D Cutting Algorithm', () => {
    const defaultOptions = {
        algorithm: 'FFD',
        kerf: 0,
        minUsableWaste: 0
    };
    describe('First Fit Decreasing (FFD)', () => {
        it('should optimize basic cuts correctly (Perfect Fit)', () => {
            // Scenario: 2 pieces of 500mm fitting into 1 bar of 1000mm
            const pieces = [
                { id: 'p1', length: 500, quantity: 1, orderItemId: 'o1' },
                { id: 'p2', length: 500, quantity: 1, orderItemId: 'o2' }
            ];
            const stock = [{ id: 's1', length: 1000, available: 1 }];
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(true);
            expect(result.stockUsedCount).toBe(1);
            expect(result.bars[0].cuts).toHaveLength(2);
            expect(result.totalWaste).toBe(0);
        });
        it('should handle kerf (blade width)', () => {
            // Scenario: 2 pieces of 495mm + 10mm kerf = 500 + 500 = 1000mm needed?
            // Actually: Piece 1 (495) + Kerf (10) + Piece 2 (495) = 1000mm exactly IF kerf is applied between cuts
            // Our algorithm applies kerf AFTER existing cuts.
            // Pos 0: Piece 1 (0-495). Next pos: 495 + 10 = 505.
            // Pos 505: Piece 2 (505-1000). Total used: 1000.
            const pieces = [{ id: 'p1', length: 495, quantity: 2, orderItemId: 'o1' }];
            const stock = [{ id: 's1', length: 1000, available: 1 }];
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, { ...defaultOptions, kerf: 10 });
            expect(result.success).toBe(true);
            expect(result.bars[0].cuts).toHaveLength(2);
            expect(result.bars[0].cuts[0].position).toBe(0);
            expect(result.bars[0].cuts[1].position).toBe(505); // 495 + 10
        });
        it('should report unplaced pieces when stock is insufficient', () => {
            const pieces = [{ id: 'p1', length: 1500, quantity: 1, orderItemId: 'o1' }];
            const stock = [{ id: 's1', length: 1000, available: 1 }];
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(false);
            expect(result.unplacedPieces).toHaveLength(1);
            expect(result.unplacedPieces[0].id).toBe('p1');
        });
        it('should expand quantity correctly', () => {
            const pieces = [{ id: 'p1', length: 100, quantity: 5, orderItemId: 'o1' }];
            const stock = [{ id: 's1', length: 1000, available: 1 }];
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(true);
            expect(result.bars[0].cuts).toHaveLength(5);
        });
    });
    describe('Best Fit Decreasing (BFD)', () => {
        it('should be selected via options', () => {
            const pieces = [{ id: 'p1', length: 100, quantity: 1, orderItemId: 'o1' }];
            const stock = [{ id: 's1', length: 1000, available: 1 }];
            // We can't easily spy on the internal function export, but we can verify it runs and produces valid output
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, { ...defaultOptions, algorithm: 'BFD' });
            expect(result.success).toBe(true);
        });
        it('should choose the tightest fit among available bars', () => {
            // Scenario: Piece 800.
            // Stock A: 1000 (Waste 200)
            // Stock B: 900 (Waste 100) -> BFD should choose this
            // FFD (sorted by length desc) would see 1000 then 900. It might pick 1000 if it checks that first.
            // Wait, FFD checks *active* bars first, but for new bars it checks sorted stock.
            // FFD sorts stock desc (1000, 900). It would pick 1000.
            // BFD sorts stock asc/desc? Implementation says: BFD sorts stock by length (asc usually, but let's check code).
            // Code says: `sortedStock = [...stockBars].sort((a, b) => a.length - b.length);` (Ascending, so smaller first!)
            const pieces = [{ id: 'p1', length: 800, quantity: 1, orderItemId: 'o1' }];
            const stock = [
                { id: 'big', length: 1000, available: 1 },
                { id: 'small', length: 900, available: 1 }
            ];
            const result = (0, cutting1d_1.optimize1D)(pieces, stock, { ...defaultOptions, algorithm: 'BFD' });
            expect(result.success).toBe(true);
            expect(result.bars[0].stockId).toBe('small'); // Should pick 900 over 1000
        });
    });
});
//# sourceMappingURL=cutting1d.spec.js.map