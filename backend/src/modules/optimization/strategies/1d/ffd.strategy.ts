/**
 * First Fit Decreasing (FFD) Strategy
 * 1D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */

import {
    I1DAlgorithm,
    I1DPiece,
    I1DStock,
    I1DResult,
    I1DBarResult,
    I1DCutPosition,
    I1DAlgorithmOptions
} from '../../interfaces';

interface ActiveBar {
    stockId: string;
    stockLength: number;
    remainingLength: number;
    cuts: I1DCutPosition[];
    currentPosition: number;
}

interface ExpandedPiece {
    id: string;
    length: number;
    orderItemId?: string;
    originalId: string;
}

export class FFDStrategy implements I1DAlgorithm {
    readonly name = '1D_FFD';
    readonly type = '1D' as const;
    readonly description = 'First Fit Decreasing - Places each piece in the first bar that fits';

    execute(pieces: I1DPiece[], stock: I1DStock[], options: I1DAlgorithmOptions): I1DResult {
        if (pieces.length === 0 || stock.length === 0) {
            return this.emptyResult();
        }

        // Expand pieces by quantity
        const expandedPieces = this.expandPieces(pieces);

        // Sort pieces by length (descending)
        expandedPieces.sort((a, b) => b.length - a.length);

        // Sort stock by length (descending) for better utilization
        const sortedStock = [...stock].sort((a, b) => b.length - a.length);

        const activeBars: ActiveBar[] = [];
        const unplacedPieces: I1DPiece[] = [];
        const stockUsage = new Map<string, { remaining: number }>();
        const { kerf, minUsableWaste } = options;

        // Initialize stock usage
        for (const s of sortedStock) {
            stockUsage.set(s.id, { remaining: s.available });
        }

        // Process each piece
        for (const piece of expandedPieces) {
            const placed = this.tryPlaceInExistingBar(activeBars, piece, kerf);

            if (!placed) {
                const newBar = this.tryCreateNewBar(sortedStock, stockUsage, piece, kerf);
                if (newBar) {
                    activeBars.push(newBar);
                } else {
                    this.addUnplacedPiece(unplacedPieces, piece);
                }
            }
        }

        return this.buildResult(activeBars, unplacedPieces, minUsableWaste, kerf);
    }

    private expandPieces(pieces: I1DPiece[]): ExpandedPiece[] {
        const expanded: ExpandedPiece[] = [];
        for (const piece of pieces) {
            for (let i = 0; i < piece.quantity; i++) {
                expanded.push({
                    id: `${piece.id}_${i}`,
                    length: piece.length,
                    orderItemId: piece.orderItemId,
                    originalId: piece.id
                });
            }
        }
        return expanded;
    }

    private tryPlaceInExistingBar(activeBars: ActiveBar[], piece: ExpandedPiece, kerf: number): boolean {
        for (const bar of activeBars) {
            if (bar.remainingLength >= piece.length + kerf) {
                bar.cuts.push({
                    pieceId: piece.id,
                    orderItemId: piece.orderItemId,
                    position: bar.currentPosition,
                    length: piece.length
                });
                bar.currentPosition += piece.length + kerf;
                bar.remainingLength -= piece.length + kerf;
                return true;
            }
        }
        return false;
    }

    private tryCreateNewBar(
        stock: I1DStock[],
        stockUsage: Map<string, { remaining: number }>,
        piece: ExpandedPiece,
        kerf: number
    ): ActiveBar | null {
        for (const s of stock) {
            const usage = stockUsage.get(s.id);
            if (usage && usage.remaining > 0 && s.length >= piece.length) {
                usage.remaining--;
                return {
                    stockId: s.id,
                    stockLength: s.length,
                    remainingLength: s.length - piece.length - kerf,
                    cuts: [
                        {
                            pieceId: piece.id,
                            orderItemId: piece.orderItemId,
                            position: 0,
                            length: piece.length
                        }
                    ],
                    currentPosition: piece.length + kerf
                };
            }
        }
        return null;
    }

    private addUnplacedPiece(unplacedPieces: I1DPiece[], piece: ExpandedPiece): void {
        const existing = unplacedPieces.find((p) => p.id === piece.originalId);
        if (existing) {
            existing.quantity++;
        } else {
            unplacedPieces.push({
                id: piece.originalId,
                length: piece.length,
                quantity: 1,
                orderItemId: piece.orderItemId ?? ''
            });
        }
    }

    private buildResult(
        activeBars: ActiveBar[],
        unplacedPieces: I1DPiece[],
        minUsableWaste: number,
        kerf: number
    ): I1DResult {
        let totalWaste = 0;
        let totalStockLength = 0;
        let totalUsedLength = 0;
        let totalPieces = 0;

        const bars: I1DBarResult[] = activeBars.map((bar) => {
            const usedLength = bar.cuts.reduce((sum, cut) => sum + cut.length + kerf, 0) - kerf;
            const waste = bar.stockLength - usedLength;
            const wastePercentage = (waste / bar.stockLength) * 100;

            totalStockLength += bar.stockLength;
            totalUsedLength += usedLength;
            totalWaste += waste;
            totalPieces += bar.cuts.length;

            const result: I1DBarResult = {
                stockId: bar.stockId,
                stockLength: bar.stockLength,
                cuts: bar.cuts,
                waste,
                wastePercentage
            };

            if (waste >= minUsableWaste) {
                result.usableWaste = {
                    position: bar.currentPosition,
                    length: waste
                };
            }

            return result;
        });

        const totalWastePercentage = totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0;

        return {
            success: unplacedPieces.length === 0,
            bars,
            totalWaste,
            totalWastePercentage,
            stockUsedCount: bars.length,
            unplacedPieces,
            statistics: {
                totalPieces,
                totalStockLength,
                totalUsedLength,
                efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
            }
        };
    }

    private emptyResult(): I1DResult {
        return {
            success: false,
            bars: [],
            totalWaste: 0,
            totalWastePercentage: 0,
            stockUsedCount: 0,
            unplacedPieces: [],
            statistics: {
                totalPieces: 0,
                totalStockLength: 0,
                totalUsedLength: 0,
                efficiency: 0
            }
        };
    }
}
