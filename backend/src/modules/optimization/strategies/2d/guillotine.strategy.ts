/**
 * Guillotine Cutting Strategy
 * 2D cutting optimization algorithm with guillotine constraints
 * Following SRP - Single algorithm implementation
 */

import {
    I2DAlgorithm,
    I2DPiece,
    I2DStock,
    I2DResult,
    I2DSheetResult,
    I2DPlacement,
    I2DAlgorithmOptions
} from '../../interfaces';

interface FreeRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ActiveSheet {
    stockId: string;
    width: number;
    height: number;
    placements: I2DPlacement[];
    freeRects: FreeRectangle[];
}

interface ExpandedPiece {
    id: string;
    width: number;
    height: number;
    orderItemId?: string;
    originalId: string;
    canRotate: boolean;
}

export class GuillotineStrategy implements I2DAlgorithm {
    readonly name = '2D_GUILLOTINE';
    readonly type = '2D' as const;
    readonly description = 'Guillotine Cutting - Only straight cuts from edge to edge';

    execute(pieces: I2DPiece[], stock: I2DStock[], options: I2DAlgorithmOptions): I2DResult {
        if (pieces.length === 0 || stock.length === 0) {
            return this.emptyResult();
        }

        const expandedPieces = this.expandPieces(pieces);
        expandedPieces.sort((a, b) => (b.width * b.height) - (a.width * a.height));

        const sortedStock = [...stock].sort((a, b) => (b.width * b.height) - (a.width * a.height));
        const activeSheets: ActiveSheet[] = [];
        const unplacedPieces: I2DPiece[] = [];
        const stockUsage = new Map<string, number>();
        const { kerf, allowRotation } = options;

        for (const s of sortedStock) {
            stockUsage.set(s.id, s.available);
        }

        for (const piece of expandedPieces) {
            const placed = this.tryPlaceInActiveSheets(activeSheets, piece, kerf, allowRotation);

            if (!placed) {
                const newSheet = this.tryCreateNewSheet(sortedStock, stockUsage, piece, kerf, allowRotation);
                if (newSheet) {
                    activeSheets.push(newSheet);
                } else {
                    this.addUnplacedPiece(unplacedPieces, piece);
                }
            }
        }

        return this.buildResult(activeSheets, expandedPieces, unplacedPieces);
    }

    private expandPieces(pieces: I2DPiece[]): ExpandedPiece[] {
        const expanded: ExpandedPiece[] = [];
        for (const piece of pieces) {
            for (let i = 0; i < piece.quantity; i++) {
                expanded.push({
                    id: `${piece.id}_${i}`,
                    width: piece.width,
                    height: piece.height,
                    orderItemId: piece.orderItemId,
                    originalId: piece.id,
                    canRotate: piece.canRotate
                });
            }
        }
        return expanded;
    }

    private tryPlaceInActiveSheets(
        sheets: ActiveSheet[],
        piece: ExpandedPiece,
        kerf: number,
        allowRotation: boolean
    ): boolean {
        const orientations = this.getOrientations(piece, allowRotation);

        for (const sheet of sheets) {
            for (const orient of orientations) {
                const rectIndex = this.findBestFreeRect(sheet.freeRects, orient, kerf);
                if (rectIndex >= 0) {
                    const rect = sheet.freeRects[rectIndex];

                    sheet.placements.push({
                        pieceId: piece.id,
                        orderItemId: piece.orderItemId,
                        x: rect.x,
                        y: rect.y,
                        width: orient.width,
                        height: orient.height,
                        rotated: orient.rotated
                    });

                    this.splitFreeRect(sheet.freeRects, rectIndex, orient, kerf);
                    return true;
                }
            }
        }
        return false;
    }

    private getOrientations(piece: ExpandedPiece, allowRotation: boolean): Array<{ width: number; height: number; rotated: boolean }> {
        const orientations = [{ width: piece.width, height: piece.height, rotated: false }];
        if (allowRotation && piece.canRotate && piece.width !== piece.height) {
            orientations.push({ width: piece.height, height: piece.width, rotated: true });
        }
        return orientations;
    }

    private findBestFreeRect(
        freeRects: FreeRectangle[],
        dims: { width: number; height: number },
        kerf: number
    ): number {
        let bestIndex = -1;
        let bestShortSide = Infinity;

        for (let i = 0; i < freeRects.length; i++) {
            const rect = freeRects[i];
            if (rect.width >= dims.width + kerf && rect.height >= dims.height + kerf) {
                const shortSide = Math.min(
                    rect.width - dims.width - kerf,
                    rect.height - dims.height - kerf
                );
                if (shortSide < bestShortSide) {
                    bestShortSide = shortSide;
                    bestIndex = i;
                }
            }
        }
        return bestIndex;
    }

    private splitFreeRect(
        freeRects: FreeRectangle[],
        index: number,
        dims: { width: number; height: number },
        kerf: number
    ): void {
        const rect = freeRects[index];
        const pieceWidth = dims.width + kerf;
        const pieceHeight = dims.height + kerf;

        // Remove the used rectangle
        freeRects.splice(index, 1);

        // Create two new rectangles (guillotine split)
        const rightWidth = rect.width - pieceWidth;
        const topHeight = rect.height - pieceHeight;

        // Horizontal split (right side)
        if (rightWidth > kerf) {
            freeRects.push({
                x: rect.x + pieceWidth,
                y: rect.y,
                width: rightWidth,
                height: rect.height
            });
        }

        // Vertical split (top side) - only the piece width
        if (topHeight > kerf) {
            freeRects.push({
                x: rect.x,
                y: rect.y + pieceHeight,
                width: pieceWidth,
                height: topHeight
            });
        }
    }

    private tryCreateNewSheet(
        stock: I2DStock[],
        stockUsage: Map<string, number>,
        piece: ExpandedPiece,
        kerf: number,
        allowRotation: boolean
    ): ActiveSheet | null {
        const orientations = this.getOrientations(piece, allowRotation);

        for (const s of stock) {
            const remaining = stockUsage.get(s.id) ?? 0;
            if (remaining <= 0) continue;

            for (const orient of orientations) {
                const fitsInStock = s.width >= orient.width + kerf && s.height >= orient.height + kerf;
                if (!fitsInStock) continue;

                stockUsage.set(s.id, remaining - 1);
                return this.initializeSheet(s, piece, orient, kerf);
            }
        }
        return null;
    }

    private initializeSheet(
        stock: I2DStock,
        piece: ExpandedPiece,
        orient: { width: number; height: number; rotated: boolean },
        kerf: number
    ): ActiveSheet {
        const pieceWidth = orient.width + kerf;
        const pieceHeight = orient.height + kerf;

        const sheet: ActiveSheet = {
            stockId: stock.id,
            width: stock.width,
            height: stock.height,
            placements: [{
                pieceId: piece.id,
                orderItemId: piece.orderItemId,
                x: 0,
                y: 0,
                width: orient.width,
                height: orient.height,
                rotated: orient.rotated
            }],
            freeRects: []
        };

        // Initialize free rectangles after first placement
        if (stock.width - pieceWidth > kerf) {
            sheet.freeRects.push({
                x: pieceWidth,
                y: 0,
                width: stock.width - pieceWidth,
                height: stock.height
            });
        }

        if (stock.height - pieceHeight > kerf) {
            sheet.freeRects.push({
                x: 0,
                y: pieceHeight,
                width: pieceWidth,
                height: stock.height - pieceHeight
            });
        }

        return sheet;
    }

    private addUnplacedPiece(unplacedPieces: I2DPiece[], piece: ExpandedPiece): void {
        const existing = unplacedPieces.find(p => p.id === piece.originalId);
        if (existing) {
            existing.quantity++;
        } else {
            unplacedPieces.push({
                id: piece.originalId,
                width: piece.width,
                height: piece.height,
                quantity: 1,
                orderItemId: piece.orderItemId ?? '',
                canRotate: piece.canRotate
            });
        }
    }

    private buildResult(
        sheets: ActiveSheet[],
        expandedPieces: ExpandedPiece[],
        unplacedPieces: I2DPiece[]
    ): I2DResult {
        let totalWasteArea = 0;
        let totalStockArea = 0;
        let totalUsedArea = 0;

        const sheetResults: I2DSheetResult[] = sheets.map(sheet => {
            const stockArea = sheet.width * sheet.height;
            const usedArea = sheet.placements.reduce((sum, p) => sum + (p.width * p.height), 0);
            const wasteArea = stockArea - usedArea;
            const wastePercentage = (wasteArea / stockArea) * 100;

            totalStockArea += stockArea;
            totalUsedArea += usedArea;
            totalWasteArea += wasteArea;

            return {
                stockId: sheet.stockId,
                stockWidth: sheet.width,
                stockHeight: sheet.height,
                placements: sheet.placements,
                wasteArea,
                wastePercentage,
                usedArea
            };
        });

        const totalWastePercentage = totalStockArea > 0
            ? (totalWasteArea / totalStockArea) * 100
            : 0;

        return {
            success: unplacedPieces.length === 0,
            sheets: sheetResults,
            totalWasteArea,
            totalWastePercentage,
            stockUsedCount: sheets.length,
            unplacedPieces,
            statistics: {
                totalPieces: expandedPieces.length - unplacedPieces.reduce((s, p) => s + p.quantity, 0),
                totalStockArea,
                totalUsedArea,
                efficiency: totalStockArea > 0 ? (totalUsedArea / totalStockArea) * 100 : 0
            }
        };
    }

    private emptyResult(): I2DResult {
        return {
            success: false,
            sheets: [],
            totalWasteArea: 0,
            totalWastePercentage: 0,
            stockUsedCount: 0,
            unplacedPieces: [],
            statistics: {
                totalPieces: 0,
                totalStockArea: 0,
                totalUsedArea: 0,
                efficiency: 0
            }
        };
    }
}
