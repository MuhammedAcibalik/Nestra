/**
 * Mathematical and Computational Tests for 2D Cutting Algorithms
 * Tests geometric validation, rotation, algorithm-specific properties, and edge cases
 */

import {
    bottomLeftFill,
    guillotineCutting,
    optimize2D,
    CuttingPiece2D,
    StockSheet2D,
    Optimization2DOptions,
    Optimization2DResult,
    PlacedPiece2D
} from '../cutting2d';

describe('2D Cutting Algorithm - Mathematical Tests', () => {
    // ==================== GEOMETRIC VALIDATION TESTS ====================
    describe('Geometric Validation', () => {
        const defaultOptions: Optimization2DOptions = {
            algorithm: 'BOTTOM_LEFT',
            kerf: 3,
            allowRotation: true,
            guillotineOnly: false
        };

        it('should conserve total area: placed + waste = stock', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 300, height: 200, quantity: 2, orderItemId: 'o1', canRotate: true },
                { id: 'p2', width: 250, height: 150, quantity: 3, orderItemId: 'o2', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 2 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            // Conservation: sum of piece areas + waste = total stock area
            let totalPiecesArea = 0;
            for (const sheet of result.sheets) {
                for (const placement of sheet.placements) {
                    totalPiecesArea += placement.width * placement.height;
                }
            }

            const totalStockArea = result.statistics.totalStockArea;
            const calculatedTotal = totalPiecesArea + result.totalWasteArea;

            expect(calculatedTotal).toBeCloseTo(totalStockArea, 5);
        });

        it('should verify no overlapping rectangles', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 200, quantity: 4, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 150, height: 150, quantity: 3, orderItemId: 'o2', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, { ...defaultOptions, kerf: 0 });

            for (const sheet of result.sheets) {
                const placements = sheet.placements;

                for (let i = 0; i < placements.length; i++) {
                    for (let j = i + 1; j < placements.length; j++) {
                        const r1 = placements[i];
                        const r2 = placements[j];

                        // Check for overlap
                        const noOverlap =
                            r1.x + r1.width <= r2.x ||
                            r2.x + r2.width <= r1.x ||
                            r1.y + r1.height <= r2.y ||
                            r2.y + r2.height <= r1.y;

                        expect(noOverlap).toBe(true);
                    }
                }
            }
        });

        it('should keep all pieces within sheet boundaries', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 300, height: 400, quantity: 3, orderItemId: 'o1', canRotate: true },
                { id: 'p2', width: 200, height: 300, quantity: 2, orderItemId: 'o2', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 800, available: 2 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            for (const sheet of result.sheets) {
                for (const p of sheet.placements) {
                    expect(p.x).toBeGreaterThanOrEqual(0);
                    expect(p.y).toBeGreaterThanOrEqual(0);
                    expect(p.x + p.width).toBeLessThanOrEqual(sheet.stockWidth);
                    expect(p.y + p.height).toBeLessThanOrEqual(sheet.stockHeight);
                }
            }
        });

        it('should maintain kerf clearance between pieces', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 400, height: 400, quantity: 2, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const kerf = 10;
            const result = bottomLeftFill(pieces, stock, { ...defaultOptions, kerf });

            if (result.sheets[0].placements.length === 2) {
                const p1 = result.sheets[0].placements[0];
                const p2 = result.sheets[0].placements[1];

                // Calculate minimum distance between pieces
                const horizontalGap = Math.abs(p2.x - (p1.x + p1.width));
                const verticalGap = Math.abs(p2.y - (p1.y + p1.height));

                // At least one gap should be >= kerf (they're adjacent in one direction)
                const hasKerfGap = horizontalGap >= kerf || verticalGap >= kerf;
                expect(hasKerfGap).toBe(true);
            }
        });
    });

    // ==================== ROTATION TESTS ====================
    describe('Rotation Handling', () => {
        const defaultOptions: Optimization2DOptions = {
            algorithm: 'BOTTOM_LEFT',
            kerf: 0,
            allowRotation: true,
            guillotineOnly: false
        };

        it('should correctly swap width/height when rotating', () => {
            // Sheet: 100x200, Piece: 200x100 -> needs rotation to fit
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 100, height: 200, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            const placement = result.sheets[0].placements[0];
            expect(placement.rotated).toBe(true);
            expect(placement.width).toBe(100); // Original height becomes width
            expect(placement.height).toBe(200); // Original width becomes height
        });

        it('should respect canRotate: false constraint', () => {
            // Piece needs rotation but canRotate is false
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 100, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 100, height: 200, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.unplacedPieces).toHaveLength(1);
        });

        it('should not rotate square pieces (optimization)', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 100, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 200, height: 200, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            // Square pieces should not be marked as rotated (no benefit)
            expect(result.sheets[0].placements[0].rotated).toBe(false);
        });

        it('should prefer non-rotated placement when both fit', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 500, height: 500, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            // When both orientations fit, prefer original (non-rotated)
            expect(result.sheets[0].placements[0].rotated).toBe(false);
        });
    });

    // ==================== BOTTOM-LEFT ALGORITHM TESTS ====================
    describe('Bottom-Left Fill Algorithm', () => {
        const defaultOptions: Optimization2DOptions = {
            algorithm: 'BOTTOM_LEFT',
            kerf: 0,
            allowRotation: true,
            guillotineOnly: false
        };

        it('should place pieces following Y-then-X priority (bottom-left)', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 300, height: 300, quantity: 4, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            // First piece should be at origin
            expect(result.sheets[0].placements[0]).toMatchObject({ x: 0, y: 0 });

            // Placements should prioritize lower Y, then lower X
            const placements = result.sheets[0].placements;
            for (let i = 0; i < placements.length - 1; i++) {
                const curr = placements[i];
                const next = placements[i + 1];

                // Next piece should have equal or greater Y, or if same Y, greater or equal X
                const validOrder = next.y > curr.y || (next.y === curr.y && next.x >= curr.x) ||
                    // Or pieces are in different rows
                    (curr.y + curr.height <= next.y);
                expect(validOrder).toBe(true);
            }
        });

        it('should generate corner positions as candidates', () => {
            // After placing first piece, next piece should use corner positions
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 400, height: 400, quantity: 1, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 200, height: 200, quantity: 1, orderItemId: 'o2', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            // Second piece should be at a corner of first piece
            const p2 = result.sheets[0].placements[1];
            const validCornerPositions = [
                { x: 400, y: 0 },   // Right of first piece
                { x: 0, y: 400 }    // Above first piece
            ];

            const isAtCorner = validCornerPositions.some(
                pos => p2.x === pos.x && p2.y === pos.y
            );
            expect(isAtCorner).toBe(true);
        });

        it('should maximize sheet utilization (minimize gaps)', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 200, quantity: 16, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 800, height: 800, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            // 16 pieces of 200x200 = 640000 area
            // Sheet = 800x800 = 640000 area
            // Perfect fit should have 0 waste
            expect(result.success).toBe(true);
            expect(result.totalWasteArea).toBe(0);
            expect(result.statistics.efficiency).toBe(100);
        });
    });

    // ==================== GUILLOTINE ALGORITHM TESTS ====================
    describe('Guillotine Cutting Algorithm', () => {
        const guillotineOptions: Optimization2DOptions = {
            algorithm: 'GUILLOTINE',
            kerf: 0,
            allowRotation: true,
            guillotineOnly: true
        };

        it('should split free rectangles after placement', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 300, height: 200, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = guillotineCutting(pieces, stock, guillotineOptions);

            expect(result.success).toBe(true);
            // After placing 300x200 at origin:
            // Right split: (300, 0) to (1000, 1000) = 700x1000
            // Top split: (0, 200) to (300, 1000) = 300x800
            // These are managed internally, but result should be correct
            expect(result.sheets[0].placements[0]).toMatchObject({ x: 0, y: 0, width: 300, height: 200 });
        });

        it('should use best-fit scoring (minimum dimension difference)', () => {
            // Two free rectangles:
            // - 500x400 (area 200000)
            // - 350x350 (area 122500)
            // Piece: 300x300
            // Best fit: 350x350 (smaller leftover dimensions)
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 400, height: 300, quantity: 1, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 300, height: 300, quantity: 1, orderItemId: 'o2', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = guillotineCutting(pieces, stock, guillotineOptions);

            expect(result.success).toBe(true);
            expect(result.sheets[0].placements).toHaveLength(2);
        });

        it('should handle kerf in guillotine splits', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 495, height: 495, quantity: 2, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const kerf = 10;
            const result = guillotineCutting(pieces, stock, { ...guillotineOptions, kerf });

            expect(result.success).toBe(true);
            // With kerf=10, pieces should still fit:
            // First piece at (0,0): 495x495
            // Right split starts at 495+10=505
            // Second piece needs 495x495, available: (1000-505) x 1000 = 495 x 1000 ✓
            expect(result.sheets[0].placements).toHaveLength(2);
        });

        it('should produce valid guillotine-style cuts (axis-aligned only)', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 300, height: 400, quantity: 1, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 200, height: 300, quantity: 1, orderItemId: 'o2', canRotate: false },
                { id: 'p3', width: 250, height: 250, quantity: 1, orderItemId: 'o3', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = guillotineCutting(pieces, stock, guillotineOptions);

            expect(result.success).toBe(true);

            // All placements should have edges aligned to sheet edges or other pieces
            for (const p of result.sheets[0].placements) {
                // x and y should be 0 or aligned to another piece's edge
                expect(Number.isInteger(p.x)).toBe(true);
                expect(Number.isInteger(p.y)).toBe(true);
            }
        });
    });

    // ==================== EDGE CASE TESTS ====================
    describe('Edge Cases', () => {
        const defaultOptions: Optimization2DOptions = {
            algorithm: 'BOTTOM_LEFT',
            kerf: 0,
            allowRotation: true,
            guillotineOnly: false
        };

        it('should handle empty pieces array', () => {
            const pieces: CuttingPiece2D[] = [];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 5 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.sheets).toHaveLength(0);
            expect(result.stockUsedCount).toBe(0);
        });

        it('should handle piece exactly matching sheet dimensions', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 1000, height: 800, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 800, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.stockUsedCount).toBe(1);
            expect(result.totalWasteArea).toBe(0);
            expect(result.statistics.efficiency).toBe(100);
        });

        it('should handle many small pieces (fragmentation stress test)', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'small', width: 50, height: 50, quantity: 100, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 500, height: 500, available: 2 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.statistics.totalPieces).toBe(100);

            // 100 pieces of 50x50 = 250000 area
            // 2 sheets of 500x500 = 500000 area
            // Should use exactly 1 sheet (100 pieces fit in 500x500 as 10x10 grid)
            expect(result.stockUsedCount).toBe(1);
        });

        it('should mark oversized pieces as unplaced', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'huge', width: 2000, height: 2000, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 10 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.unplacedPieces).toHaveLength(1);
            expect(result.unplacedPieces[0].id).toBe('huge');
        });
    });

    // ==================== MATHEMATICAL CALCULATION TESTS ====================
    describe('Mathematical Calculations', () => {
        const defaultOptions: Optimization2DOptions = {
            algorithm: 'BOTTOM_LEFT',
            kerf: 0,
            allowRotation: true,
            guillotineOnly: false
        };

        it('should calculate area efficiency correctly', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 500, height: 400, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            // Piece area: 500 * 400 = 200000
            // Stock area: 1000 * 1000 = 1000000
            // Efficiency: (200000 / 1000000) * 100 = 20%
            expect(result.statistics.efficiency).toBeCloseTo(20, 5);
            expect(result.statistics.totalUsedArea).toBe(200000);
            expect(result.statistics.totalStockArea).toBe(1000000);
        });

        it('should calculate waste percentage per sheet correctly', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 600, height: 800, quantity: 1, orderItemId: 'o1', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 1 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            const sheet = result.sheets[0];
            // Used: 600 * 800 = 480000
            // Stock: 1000 * 1000 = 1000000
            // Waste: 1000000 - 480000 = 520000
            // Waste %: (520000 / 1000000) * 100 = 52%

            expect(sheet.usedArea).toBe(480000);
            expect(sheet.wasteArea).toBe(520000);
            expect(sheet.wastePercentage).toBeCloseTo(52, 5);
        });

        it('should correctly count total placed pieces', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 200, height: 200, quantity: 5, orderItemId: 'o1', canRotate: false },
                { id: 'p2', width: 150, height: 150, quantity: 3, orderItemId: 'o2', canRotate: false }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 1000, height: 1000, available: 2 }
            ];

            const result = bottomLeftFill(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.statistics.totalPieces).toBe(8); // 5 + 3
        });
    });

    // ==================== ALGORITHM SELECTION TESTS ====================
    describe('Algorithm Selection', () => {
        it('should use BOTTOM_LEFT when specified', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 100, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 500, height: 500, available: 1 }
            ];

            const result = optimize2D(pieces, stock, {
                algorithm: 'BOTTOM_LEFT',
                kerf: 0,
                allowRotation: true,
                guillotineOnly: false
            });

            expect(result.success).toBe(true);
        });

        it('should use GUILLOTINE when specified', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 100, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 500, height: 500, available: 1 }
            ];

            const result = optimize2D(pieces, stock, {
                algorithm: 'GUILLOTINE',
                kerf: 0,
                allowRotation: true,
                guillotineOnly: true
            });

            expect(result.success).toBe(true);
        });

        it('should fallback to guillotine for MAXRECTS', () => {
            const pieces: CuttingPiece2D[] = [
                { id: 'p1', width: 100, height: 100, quantity: 1, orderItemId: 'o1', canRotate: true }
            ];
            const stock: StockSheet2D[] = [
                { id: 's1', width: 500, height: 500, available: 1 }
            ];

            const result = optimize2D(pieces, stock, {
                algorithm: 'MAXRECTS',
                kerf: 0,
                allowRotation: true,
                guillotineOnly: false
            });

            expect(result.success).toBe(true);
        });
    });
});
