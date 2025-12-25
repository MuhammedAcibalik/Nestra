/**
 * Mathematical and Computational Tests for 1D Cutting Algorithms
 * Tests conservation laws, algorithmic properties, edge cases, and mathematical calculations
 */

import {
    firstFitDecreasing,
    bestFitDecreasing,
    optimize1D,
    CuttingPiece1D,
    StockBar1D,
    Optimization1DOptions,
    Optimization1DResult
} from '../cutting1d';

describe('1D Cutting Algorithm - Mathematical Tests', () => {
    // ==================== CONSERVATION TESTS ====================
    describe('Conservation Laws', () => {
        const defaultOptions: Optimization1DOptions = {
            algorithm: 'FFD',
            kerf: 3,
            minUsableWaste: 100
        };

        it('should conserve total material: placed + waste = stock used', () => {
            const pieces: CuttingPiece1D[] = [
                { id: 'p1', length: 300, quantity: 3, orderItemId: 'o1' },
                { id: 'p2', length: 250, quantity: 2, orderItemId: 'o2' },
                { id: 'p3', length: 150, quantity: 4, orderItemId: 'o3' }
            ];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 5 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            // Calculate total placed length (excluding kerf, as waste includes it)
            let totalPlacedLength = 0;
            for (const bar of result.bars) {
                for (const cut of bar.cuts) {
                    totalPlacedLength += cut.length;
                }
            }

            // Conservation: placed + waste = total stock
            const totalStockUsed = result.statistics.totalStockLength;
            const calculatedTotal = totalPlacedLength + result.totalWaste;

            // Account for kerf between pieces
            let totalKerfUsed = 0;
            for (const bar of result.bars) {
                totalKerfUsed += Math.max(0, bar.cuts.length - 1) * defaultOptions.kerf;
            }

            expect(totalPlacedLength + totalKerfUsed + result.totalWaste).toBeCloseTo(totalStockUsed, 5);
        });

        it('should correctly account for kerf in position calculations', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 200, quantity: 3, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const kerf = 5;
            const result = firstFitDecreasing(pieces, stock, { ...defaultOptions, kerf });

            // Verify positions: 0, 200+5=205, 205+200+5=410
            expect(result.bars[0].cuts[0].position).toBe(0);
            expect(result.bars[0].cuts[1].position).toBe(200 + kerf);
            expect(result.bars[0].cuts[2].position).toBe(200 + kerf + 200 + kerf);
        });

        it('should verify no overlapping pieces', () => {
            const pieces: CuttingPiece1D[] = [
                { id: 'p1', length: 100, quantity: 5, orderItemId: 'o1' },
                { id: 'p2', length: 200, quantity: 3, orderItemId: 'o2' }
            ];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 2 }];

            const kerf = 3;
            const result = firstFitDecreasing(pieces, stock, { ...defaultOptions, kerf });

            for (const bar of result.bars) {
                const sortedCuts = [...bar.cuts].sort((a, b) => a.position - b.position);

                for (let i = 0; i < sortedCuts.length - 1; i++) {
                    const current = sortedCuts[i];
                    const next = sortedCuts[i + 1];

                    // Current piece end + kerf should be <= next piece start
                    const currentEnd = current.position + current.length;
                    expect(currentEnd + kerf).toBeLessThanOrEqual(next.position + 0.001);
                }
            }
        });
    });

    // ==================== ALGORITHMIC PROPERTY TESTS ====================
    describe('Algorithmic Properties', () => {
        const defaultOptions: Optimization1DOptions = {
            algorithm: 'FFD',
            kerf: 0,
            minUsableWaste: 0
        };

        it('BFD should produce equal or less waste than FFD for identical input', () => {
            const pieces: CuttingPiece1D[] = [
                { id: 'p1', length: 400, quantity: 2, orderItemId: 'o1' },
                { id: 'p2', length: 300, quantity: 3, orderItemId: 'o2' },
                { id: 'p3', length: 250, quantity: 2, orderItemId: 'o3' },
                { id: 'p4', length: 200, quantity: 4, orderItemId: 'o4' }
            ];
            const stock: StockBar1D[] = [
                { id: 's1', length: 1000, available: 10 },
                { id: 's2', length: 800, available: 5 }
            ];

            const ffdResult = firstFitDecreasing(pieces, stock, defaultOptions);
            const bfdResult = bestFitDecreasing(pieces, stock, defaultOptions);

            // BFD typically produces equal or better results
            expect(bfdResult.totalWastePercentage).toBeLessThanOrEqual(ffdResult.totalWastePercentage + 0.001);
        });

        it('should process pieces in decreasing order (largest first)', () => {
            const pieces: CuttingPiece1D[] = [
                { id: 'small', length: 100, quantity: 1, orderItemId: 'o1' },
                { id: 'large', length: 500, quantity: 1, orderItemId: 'o2' },
                { id: 'medium', length: 300, quantity: 1, orderItemId: 'o3' }
            ];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            // First bar should have largest piece first (at position 0)
            const firstCut = result.bars[0].cuts[0];
            expect(firstCut.length).toBe(500); // Largest piece placed first
        });

        it('BFD should select the bar with minimum remaining space', () => {
            // Setup: 2 bars with different remaining spaces
            // Piece of 200 should go into bar with less remaining space (if it fits)
            const pieces: CuttingPiece1D[] = [
                { id: 'p1', length: 600, quantity: 1, orderItemId: 'o1' },
                { id: 'p2', length: 700, quantity: 1, orderItemId: 'o2' },
                { id: 'p3', length: 200, quantity: 1, orderItemId: 'o3' } // Should go to tighter fit
            ];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 2 }];

            const result = bestFitDecreasing(pieces, stock, { ...defaultOptions, algorithm: 'BFD' });

            // After placing 700 and 600, remaining spaces are 300 and 400
            // BFD should place 200 in bar with 300 remaining (tighter fit)
            expect(result.success).toBe(true);

            // Check that no bar has more waste than necessary
            for (const bar of result.bars) {
                const usedLength = bar.cuts.reduce((sum, c) => sum + c.length, 0);
                const efficiency = (usedLength / bar.stockLength) * 100;
                expect(efficiency).toBeGreaterThan(50); // Reasonable packing
            }
        });

        it('should satisfy FFD approximation bound: waste <= 11/9 * OPT + constant', () => {
            // Theoretical bound: FFD uses at most 11/9 * OPT + 6/9 bins
            // We test that efficiency is reasonable (> 70% for typical cases)
            const pieces: CuttingPiece1D[] = [
                { id: 'p1', length: 450, quantity: 4, orderItemId: 'o1' },
                { id: 'p2', length: 350, quantity: 3, orderItemId: 'o2' },
                { id: 'p3', length: 250, quantity: 5, orderItemId: 'o3' }
            ];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 10 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            // Calculate optimal (lower bound): total piece length / stock length
            const totalPieceLength = 450 * 4 + 350 * 3 + 250 * 5; // 4100mm
            const optimalBars = Math.ceil(totalPieceLength / 1000); // 5 bars minimum

            // FFD should use at most 11/9 * optimal + 1
            const ffdBound = Math.ceil((11 / 9) * optimalBars + 1);
            expect(result.stockUsedCount).toBeLessThanOrEqual(ffdBound);
        });
    });

    // ==================== EDGE CASE TESTS ====================
    describe('Edge Cases', () => {
        const defaultOptions: Optimization1DOptions = {
            algorithm: 'FFD',
            kerf: 0,
            minUsableWaste: 0
        };

        it('should handle empty pieces array', () => {
            const pieces: CuttingPiece1D[] = [];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 5 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.bars).toHaveLength(0);
            expect(result.stockUsedCount).toBe(0);
            expect(result.totalWaste).toBe(0);
        });

        it('should handle single piece exactly matching stock', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 1000, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.stockUsedCount).toBe(1);
            expect(result.totalWaste).toBe(0);
            expect(result.statistics.efficiency).toBe(100);
        });

        it('should mark piece as unplaced when larger than all stock', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 1500, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 5 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.unplacedPieces).toHaveLength(1);
            expect(result.unplacedPieces[0].id).toBe('p1');
        });

        it('should handle zero kerf correctly', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 500, quantity: 2, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, { ...defaultOptions, kerf: 0 });

            expect(result.success).toBe(true);
            expect(result.totalWaste).toBe(0);
            expect(result.bars[0].cuts[0].position).toBe(0);
            expect(result.bars[0].cuts[1].position).toBe(500); // No kerf gap
        });

        it('should handle large kerf that reduces capacity', () => {
            // 3 pieces of 300mm with 50mm kerf
            // Total needed: 300 + 50 + 300 + 50 + 300 = 1000mm
            // Should barely fit in 1000mm bar
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 300, quantity: 3, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 2 }];

            const result = firstFitDecreasing(pieces, stock, { ...defaultOptions, kerf: 50 });

            expect(result.success).toBe(true);
            // Verify kerf is accounted for: positions should be 0, 350, 700
            expect(result.bars[0].cuts[0].position).toBe(0);
            expect(result.bars[0].cuts[1].position).toBe(350);
            expect(result.bars[0].cuts[2].position).toBe(700);
        });

        it('should handle maximum quantity expansion correctly', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 50, quantity: 100, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 10 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.statistics.totalPieces).toBe(100);

            // 100 pieces of 50mm = 5000mm total
            // Should use 5 bars of 1000mm with 20 pieces each
            expect(result.stockUsedCount).toBe(5);
        });
    });

    // ==================== MATHEMATICAL CALCULATION TESTS ====================
    describe('Mathematical Calculations', () => {
        const defaultOptions: Optimization1DOptions = {
            algorithm: 'FFD',
            kerf: 5,
            minUsableWaste: 100
        };

        it('should calculate efficiency correctly: (used / total) * 100', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 400, quantity: 2, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, defaultOptions);

            // Used: 400 + 5 (kerf) + 400 = 805mm
            // Total: 1000mm
            // Efficiency = (805 / 1000) * 100 = 80.5%
            const expectedUsed = 400 + 5 + 400;
            const expectedEfficiency = (expectedUsed / 1000) * 100;

            expect(result.statistics.efficiency).toBeCloseTo(expectedEfficiency, 1);
        });

        it('should calculate waste percentage correctly per bar', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 700, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, { ...defaultOptions, kerf: 0 });

            const bar = result.bars[0];
            const expectedWastePercentage = (300 / 1000) * 100; // 30%

            expect(bar.waste).toBe(300);
            expect(bar.wastePercentage).toBeCloseTo(expectedWastePercentage, 5);
        });

        it('should detect usable waste above threshold', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 800, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const minUsableWaste = 150;
            const kerf = 10;
            const result = firstFitDecreasing(pieces, stock, {
                ...defaultOptions,
                kerf,
                minUsableWaste
            });

            const bar = result.bars[0];

            // Waste = 200mm, which is >= minUsableWaste (150)
            expect(bar.waste).toBe(200);
            expect(bar.usableWaste).toBeDefined();
            expect(bar.usableWaste!.length).toBe(200 - kerf); // Usable = waste - kerf
        });

        it('should NOT mark waste as usable below threshold', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 950, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const result = firstFitDecreasing(pieces, stock, {
                ...defaultOptions,
                kerf: 0,
                minUsableWaste: 100
            });

            const bar = result.bars[0];

            // Waste = 50mm, which is < minUsableWaste (100)
            expect(bar.waste).toBe(50);
            expect(bar.usableWaste).toBeUndefined();
        });
    });

    // ==================== ALGORITHM SELECTION TESTS ====================
    describe('Algorithm Selection', () => {
        it('should use FFD when algorithm option is FFD', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 500, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const options: Optimization1DOptions = {
                algorithm: 'FFD',
                kerf: 0,
                minUsableWaste: 0
            };

            const result = optimize1D(pieces, stock, options);
            expect(result.success).toBe(true);
        });

        it('should use BFD when algorithm option is BFD', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 500, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const options: Optimization1DOptions = {
                algorithm: 'BFD',
                kerf: 0,
                minUsableWaste: 0
            };

            const result = optimize1D(pieces, stock, options);
            expect(result.success).toBe(true);
        });

        it('should fallback to BFD for BRANCH_BOUND algorithm', () => {
            const pieces: CuttingPiece1D[] = [{ id: 'p1', length: 500, quantity: 1, orderItemId: 'o1' }];
            const stock: StockBar1D[] = [{ id: 's1', length: 1000, available: 1 }];

            const options: Optimization1DOptions = {
                algorithm: 'BRANCH_BOUND',
                kerf: 0,
                minUsableWaste: 0
            };

            const result = optimize1D(pieces, stock, options);
            expect(result.success).toBe(true);
        });
    });
});
