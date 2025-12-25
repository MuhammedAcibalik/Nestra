/**
 * 1D Cutting Optimization Algorithm
 * Implements First Fit Decreasing (FFD) and Best Fit Decreasing (BFD)
 */

export interface CuttingPiece1D {
    id: string;
    length: number;
    quantity: number;
    orderItemId: string;
    canRotate?: boolean;
}

export interface StockBar1D {
    id: string;
    length: number;
    available: number;
    unitPrice?: number;
}

export interface CutPosition1D {
    pieceId: string;
    orderItemId: string;
    position: number;
    length: number;
}

export interface BarCuttingResult {
    stockId: string;
    stockLength: number;
    cuts: CutPosition1D[];
    waste: number;
    wastePercentage: number;
    usableWaste?: { position: number; length: number };
}

export interface Optimization1DResult {
    success: boolean;
    bars: BarCuttingResult[];
    totalWaste: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: CuttingPiece1D[];
    statistics: {
        totalPieces: number;
        totalStockLength: number;
        totalUsedLength: number;
        efficiency: number;
    };
}

export interface Optimization1DOptions {
    algorithm: 'FFD' | 'BFD' | 'BRANCH_BOUND';
    kerf: number; // Cutting blade width
    minUsableWaste: number; // Minimum length for waste to be reusable
    maxIterations?: number; // For branch and bound
}

// Internal interface for active bars during optimization
interface ActiveBar {
    stockId: string;
    stockLength: number;
    remainingLength: number;
    cuts: CutPosition1D[];
    currentPosition: number;
}

/**
 * Expands pieces array based on quantity
 */
function expandPieces(
    pieces: CuttingPiece1D[]
): Array<{ id: string; length: number; orderItemId: string; originalId: string }> {
    const expanded: Array<{ id: string; length: number; orderItemId: string; originalId: string }> = [];

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

/**
 * Helper: Find the first bar that fits the piece
 */
function findFirstFitBar(activeBars: ActiveBar[], pieceLength: number, kerf: number): ActiveBar | undefined {
    return activeBars.find((bar) => {
        const required = pieceLength + (bar.cuts.length > 0 ? kerf : 0);
        return bar.remainingLength >= required;
    });
}

/**
 * Helper: Find the bar that leaves minimum waste
 */
function findBestFitBar(activeBars: ActiveBar[], pieceLength: number, kerf: number): ActiveBar | undefined {
    let bestBar: ActiveBar | undefined;
    let minRemaining = Infinity;

    for (const bar of activeBars) {
        const required = pieceLength + (bar.cuts.length > 0 ? kerf : 0);
        if (bar.remainingLength >= required) {
            const remaining = bar.remainingLength - required;
            if (remaining < minRemaining) {
                minRemaining = remaining;
                bestBar = bar;
            }
        }
    }
    return bestBar;
}

/**
 * Helper: Place a piece in a specific bar
 */
function placePiece(bar: ActiveBar, piece: { id: string; orderItemId: string; length: number }, kerf: number): void {
    const position = bar.currentPosition + (bar.cuts.length > 0 ? kerf : 0);
    const requiredLength = piece.length + (bar.cuts.length > 0 ? kerf : 0);

    bar.cuts.push({
        pieceId: piece.id,
        orderItemId: piece.orderItemId,
        position,
        length: piece.length
    });

    bar.currentPosition = position + piece.length;
    bar.remainingLength -= requiredLength;
}

/**
 * Helper: Find available stock that fits the piece
 */
function findAvailableStock(
    sortedStock: StockBar1D[],
    stockUsage: Map<string, { remaining: number }>,
    pieceLength: number
): { stock: StockBar1D; usage: { remaining: number } } | undefined {
    for (const stock of sortedStock) {
        const usage = stockUsage.get(stock.id);
        if (usage && usage.remaining > 0 && stock.length >= pieceLength) {
            return { stock, usage };
        }
    }
    return undefined;
}

/**
 * Helper: Create a new active bar from stock
 */
function createActiveBar(stock: StockBar1D, piece: { id: string; orderItemId: string; length: number }): ActiveBar {
    return {
        stockId: stock.id,
        stockLength: stock.length,
        remainingLength: stock.length - piece.length,
        cuts: [
            {
                pieceId: piece.id,
                orderItemId: piece.orderItemId,
                position: 0,
                length: piece.length
            }
        ],
        currentPosition: piece.length
    };
}

/**
 * Helper: Add to unplaced pieces
 */
function addUnplacedPiece(
    unplacedPieces: CuttingPiece1D[],
    piece: { originalId: string; length: number; orderItemId: string }
): void {
    const existingUnplaced = unplacedPieces.find((p) => p.id === piece.originalId);
    if (existingUnplaced) {
        existingUnplaced.quantity++;
    } else {
        unplacedPieces.push({
            id: piece.originalId,
            length: piece.length,
            quantity: 1,
            orderItemId: piece.orderItemId
        });
    }
}

/**
 * Helper: Build results from active bars
 */
function buildResults(
    activeBars: ActiveBar[],
    minUsableWaste: number,
    kerf: number
): { results: BarCuttingResult[]; totalWaste: number; totalStockLength: number; totalUsedLength: number } {
    const results: BarCuttingResult[] = [];
    let totalWaste = 0;
    let totalStockLength = 0;
    let totalUsedLength = 0;

    for (const bar of activeBars) {
        const waste = bar.remainingLength;
        const wastePercentage = (waste / bar.stockLength) * 100;

        const result: BarCuttingResult = {
            stockId: bar.stockId,
            stockLength: bar.stockLength,
            cuts: bar.cuts,
            waste,
            wastePercentage
        };

        if (waste >= minUsableWaste) {
            result.usableWaste = {
                position: bar.currentPosition + kerf,
                length: waste - kerf
            };
        }

        results.push(result);
        totalWaste += waste;
        totalStockLength += bar.stockLength;
        totalUsedLength += bar.stockLength - waste;
    }

    return { results, totalWaste, totalStockLength, totalUsedLength };
}

/**
 * First Fit Decreasing Algorithm
 * Sorts pieces by length (descending) and places each in the first bar that fits
 */
export function firstFitDecreasing(
    pieces: CuttingPiece1D[],
    stockBars: StockBar1D[],
    options: Optimization1DOptions
): Optimization1DResult {
    const { kerf, minUsableWaste } = options;

    const expandedPieces = expandPieces(pieces).sort((a, b) => b.length - a.length);
    const sortedStock = [...stockBars].filter((s) => s.available > 0).sort((a, b) => b.length - a.length);

    const stockUsage = new Map<string, { remaining: number }>();
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, { remaining: stock.available });
    }

    const activeBars: ActiveBar[] = [];
    const unplacedPieces: CuttingPiece1D[] = [];

    for (const piece of expandedPieces) {
        let placed = false;

        // Try to fit in an existing active bar (First Fit)
        const bestBar = findFirstFitBar(activeBars, piece.length, kerf);

        if (bestBar) {
            placePiece(bestBar, piece, kerf);
            placed = true;
        }

        // If not placed, get a new bar from stock
        if (!placed) {
            const stockInfo = findAvailableStock(sortedStock, stockUsage, piece.length);
            if (stockInfo) {
                const newBar = createActiveBar(stockInfo.stock, piece);
                activeBars.push(newBar);
                stockInfo.usage.remaining--;
                placed = true;
            }
        }

        // If still not placed, track as unplaced
        if (!placed) {
            addUnplacedPiece(unplacedPieces, piece);
        }
    }

    const { results, totalWaste, totalStockLength, totalUsedLength } = buildResults(activeBars, minUsableWaste, kerf);
    const totalPieces = expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0);

    return {
        success: unplacedPieces.length === 0,
        bars: results,
        totalWaste,
        totalWastePercentage: totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces,
            totalStockLength,
            totalUsedLength,
            efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
        }
    };
}

/**
 * Best Fit Decreasing Algorithm
 * Similar to FFD but places each piece in the bar with the least remaining space
 */
export function bestFitDecreasing(
    pieces: CuttingPiece1D[],
    stockBars: StockBar1D[],
    options: Optimization1DOptions
): Optimization1DResult {
    const { kerf, minUsableWaste } = options;

    const expandedPieces = expandPieces(pieces).sort((a, b) => b.length - a.length);
    const sortedStock = [...stockBars].filter((s) => s.available > 0).sort((a, b) => a.length - b.length);

    const stockUsage = new Map<string, { remaining: number }>();
    for (const stock of sortedStock) {
        stockUsage.set(stock.id, { remaining: stock.available });
    }

    const activeBars: ActiveBar[] = [];
    const unplacedPieces: CuttingPiece1D[] = [];

    for (const piece of expandedPieces) {
        let placed = false;

        // Find the best fitting bar (least remaining space after placement)
        const bestBar = findBestFitBar(activeBars, piece.length, kerf);

        if (bestBar) {
            placePiece(bestBar, piece, kerf);
            placed = true;
        }

        // If not placed, get a new bar
        if (!placed) {
            const stockInfo = findAvailableStock(sortedStock, stockUsage, piece.length);
            if (stockInfo) {
                const newBar = createActiveBar(stockInfo.stock, piece);
                activeBars.push(newBar);
                stockInfo.usage.remaining--;
                placed = true;
            }
        }

        if (!placed) {
            addUnplacedPiece(unplacedPieces, piece);
        }
    }

    const { results, totalWaste, totalStockLength, totalUsedLength } = buildResults(activeBars, minUsableWaste, kerf);
    const totalPieces = expandedPieces.length - unplacedPieces.reduce((sum, p) => sum + p.quantity, 0);

    return {
        success: unplacedPieces.length === 0,
        bars: results,
        totalWaste,
        totalWastePercentage: totalStockLength > 0 ? (totalWaste / totalStockLength) * 100 : 0,
        stockUsedCount: results.length,
        unplacedPieces,
        statistics: {
            totalPieces,
            totalStockLength,
            totalUsedLength,
            efficiency: totalStockLength > 0 ? (totalUsedLength / totalStockLength) * 100 : 0
        }
    };
}

/**
 * Main optimization function that selects algorithm based on options
 */
export function optimize1D(
    pieces: CuttingPiece1D[],
    stockBars: StockBar1D[],
    options: Optimization1DOptions
): Optimization1DResult {
    switch (options.algorithm) {
        case 'FFD':
            return firstFitDecreasing(pieces, stockBars, options);
        case 'BFD':
            return bestFitDecreasing(pieces, stockBars, options);
        case 'BRANCH_BOUND':
            // For now, fall back to BFD for complex algorithm
            // Branch and Bound can be implemented for smaller datasets
            return bestFitDecreasing(pieces, stockBars, options);
        default:
            return firstFitDecreasing(pieces, stockBars, options);
    }
}
