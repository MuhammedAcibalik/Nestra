/**
 * Algorithm Interfaces
 * Generic and specific algorithm contracts
 * Following OCP - Open/Closed Principle
 */

// ==================== GENERIC ALGORITHM ====================

export interface IOptimizationAlgorithm<TPiece, TStock, TResult> {
    readonly name: string;
    readonly type: '1D' | '2D';
    readonly description: string;

    execute(pieces: TPiece[], stock: TStock[], options: IAlgorithmOptions): TResult;
}

export interface IAlgorithmOptions {
    kerf: number;
}

// ==================== 1D TYPES ====================

export interface I1DPiece {
    id: string;
    length: number;
    quantity: number;
    orderItemId?: string;
    canRotate?: boolean;
}

export interface I1DStock {
    id: string;
    length: number;
    available: number;
    unitPrice?: number;
}

export interface I1DCutPosition {
    pieceId: string;
    orderItemId?: string;
    position: number;
    length: number;
}

export interface I1DBarResult {
    stockId: string;
    stockLength: number;
    cuts: I1DCutPosition[];
    waste: number;
    wastePercentage: number;
    usableWaste?: { position: number; length: number };
}

export interface I1DResult {
    success: boolean;
    bars: I1DBarResult[];
    totalWaste: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: I1DPiece[];
    statistics: I1DStatistics;
}

export interface I1DStatistics {
    totalPieces: number;
    totalStockLength: number;
    totalUsedLength: number;
    efficiency: number;
}

export interface I1DAlgorithmOptions extends IAlgorithmOptions {
    minUsableWaste: number;
    algorithm: '1D_FFD' | '1D_BFD';
}

export interface I1DAlgorithm extends IOptimizationAlgorithm<I1DPiece, I1DStock, I1DResult> {
    readonly type: '1D';
}

// ==================== 2D TYPES ====================

export interface I2DPiece {
    id: string;
    width: number;
    height: number;
    quantity: number;
    orderItemId?: string;
    canRotate: boolean;
}

export interface I2DStock {
    id: string;
    width: number;
    height: number;
    available: number;
    unitPrice?: number;
}

export interface I2DPlacement {
    pieceId: string;
    orderItemId?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
}

export interface I2DSheetResult {
    stockId: string;
    stockWidth: number;
    stockHeight: number;
    placements: I2DPlacement[];
    wasteArea: number;
    wastePercentage: number;
    usedArea: number;
}

export interface I2DResult {
    success: boolean;
    sheets: I2DSheetResult[];
    totalWasteArea: number;
    totalWastePercentage: number;
    stockUsedCount: number;
    unplacedPieces: I2DPiece[];
    statistics: I2DStatistics;
}

export interface I2DStatistics {
    totalPieces: number;
    totalStockArea: number;
    totalUsedArea: number;
    efficiency: number;
}

export interface I2DAlgorithmOptions extends IAlgorithmOptions {
    allowRotation: boolean;
    guillotineOnly: boolean;
    algorithm: '2D_BOTTOM_LEFT' | '2D_GUILLOTINE';
}

export interface I2DAlgorithm extends IOptimizationAlgorithm<I2DPiece, I2DStock, I2DResult> {
    readonly type: '2D';
}

// ==================== REGISTRY ====================

export interface IAlgorithmRegistry {
    register1D(algorithm: I1DAlgorithm): void;
    register2D(algorithm: I2DAlgorithm): void;
    get1D(name: string): I1DAlgorithm | undefined;
    get2D(name: string): I2DAlgorithm | undefined;
    getAll1D(): I1DAlgorithm[];
    getAll2D(): I2DAlgorithm[];
}
