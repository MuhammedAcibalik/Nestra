"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cutting2d_1 = require("../cutting2d");
describe('2D Cutting Algorithm', () => {
    const defaultOptions = {
        algorithm: 'BOTTOM_LEFT',
        kerf: 0,
        allowRotation: true,
        guillotineOnly: false
    };
    describe('Bottom-Left Fill', () => {
        it('should nest basic rectangles correctly', () => {
            // Sheet: 1000x1000. Pieces: 2x 500x500.
            const pieces = [
                { id: 'p1', width: 500, height: 500, quantity: 1, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 500, height: 500, quantity: 1, orderItemId: 'o2', canRotate: false }
            ];
            const stock = [{ id: 's1', width: 1000, height: 1000, available: 1 }];
            const result = (0, cutting2d_1.optimize2D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(true);
            expect(result.stockUsedCount).toBe(1);
            expect(result.sheets[0].placements).toHaveLength(2);
            // First piece at 0,0
            expect(result.sheets[0].placements[0]).toMatchObject({ x: 0, y: 0 });
            // Second piece should be at 500,0 or 0,500 depending on sort/logic. Sorts by area? Equal area.
            // Logic: candidates sorts by Y then X.
            // Candidates after first placement (500x500 at 0,0):
            // (500,0), (0,500), (500,500). Sorted: (500,0), (0,500), (500,500).
            // So second piece should be at 500,0.
            expect(result.sheets[0].placements[1]).toMatchObject({ x: 500, y: 0 });
        });
        it('should handle rotation', () => {
            // Sheet: 100x50. Piece: 50x100 (needs rotation).
            const pieces = [
                { id: 'p1', width: 50, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock = [{ id: 's1', width: 100, height: 50, available: 1 }];
            const result = (0, cutting2d_1.optimize2D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(true);
            expect(result.sheets[0].placements[0].rotated).toBe(true);
            expect(result.sheets[0].placements[0].width).toBe(100); // Placed width (rotated height)
            expect(result.sheets[0].placements[0].height).toBe(50);
        });
        it('should NOT rotate if forbidden', () => {
            // Sheet: 100x50. Piece: 50x100 (needs rotation).
            const pieces = [
                { id: 'p1', width: 50, height: 100, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock = [{ id: 's1', width: 100, height: 50, available: 1 }];
            const result = (0, cutting2d_1.optimize2D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(false);
            expect(result.unplacedPieces).toHaveLength(1);
        });
        it('should handle multi-sheet usage', () => {
            // Sheet: 100x100. Pieces: 2x 80x80. Can't fit both in one.
            const pieces = [
                { id: 'p1', width: 80, height: 80, quantity: 2, orderItemId: 'o1', canRotate: false }
            ];
            const stock = [{ id: 's1', width: 100, height: 100, available: 2 }];
            const result = (0, cutting2d_1.optimize2D)(pieces, stock, defaultOptions);
            expect(result.success).toBe(true);
            expect(result.stockUsedCount).toBe(2);
            expect(result.sheets).toHaveLength(2);
            expect(result.sheets[0].placements).toHaveLength(1);
            expect(result.sheets[1].placements).toHaveLength(1);
        });
    });
    describe('Guillotine', () => {
        it('should successfully place pieces', () => {
            const pieces = [
                { id: 'p1', width: 100, height: 100, quantity: 2, orderItemId: 'o1', canRotate: false }
            ];
            const stock = [{ id: 's1', width: 1000, height: 1000, available: 1 }];
            const result = (0, cutting2d_1.optimize2D)(pieces, stock, { ...defaultOptions, algorithm: 'GUILLOTINE' });
            expect(result.success).toBe(true);
            expect(result.sheets[0].placements).toHaveLength(2);
        });
    });
});
//# sourceMappingURL=cutting2d.spec.js.map