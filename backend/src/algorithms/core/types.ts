/**
 * Core Algorithm Types
 * Shared type definitions for all cutting algorithms
 * Following DRY principle - single source of truth
 */

// ==================== GRAIN DIRECTION ====================

/**
 * Grain direction for wood/material patterns
 * HORIZONTAL: Pattern runs parallel to width
 * VERTICAL: Pattern runs parallel to height
 * NONE: No grain constraint (can rotate freely)
 */
export type GrainDirection = 'HORIZONTAL' | 'VERTICAL' | 'NONE';

// ==================== GENERIC TYPES ======================================

/**
 * Base interface for expanded pieces (after quantity expansion)
 */
export interface IExpandedPieceBase {
    readonly id: string;
    readonly originalId: string;
    readonly orderItemId: string;
}

/**
 * Expanded 1D piece (single unit from quantity)
 */
export interface IExpanded1DPiece extends IExpandedPieceBase {
    readonly length: number;
}

/**
 * Expanded 2D piece (single unit from quantity)
 */
export interface IExpanded2DPiece extends IExpandedPieceBase {
    readonly width: number;
    readonly height: number;
    readonly canRotate: boolean;
    readonly grainDirection?: GrainDirection;
}

// ==================== STOCK TRACKING ====================

/**
 * Stock availability tracker
 */
export interface IStockUsage {
    readonly stockId: string;
    remaining: number;
}

/**
 * Stock manager state
 */
export interface IStockManagerState<TStock> {
    readonly sortedStock: readonly TStock[];
    readonly usage: Map<string, IStockUsage>;
}

// ==================== GEOMETRY ====================

/**
 * 2D Rectangle for geometric operations
 */
export interface IRectangle {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/**
 * 2D Position
 */
export interface IPosition {
    readonly x: number;
    readonly y: number;
}

/**
 * Orientation options for 2D pieces
 */
export interface IOrientation {
    readonly width: number;
    readonly height: number;
    readonly rotated: boolean;
}

// ==================== ACTIVE STATE ====================

/**
 * Active bar state during 1D optimization
 */
export interface IActiveBar {
    readonly stockId: string;
    readonly stockLength: number;
    remainingLength: number;
    currentPosition: number;
    readonly cuts: ICutPosition[];
}

/**
 * Cut position in 1D bar
 */
export interface ICutPosition {
    readonly pieceId: string;
    readonly orderItemId: string;
    readonly position: number;
    readonly length: number;
}

/**
 * Active sheet state during 2D optimization
 */
export interface IActiveSheet {
    readonly stockId: string;
    readonly width: number;
    readonly height: number;
    readonly placements: IPlacement[];
    freeRects?: IFreeRectangle[];
}

/**
 * Placement in 2D sheet
 */
export interface IPlacement {
    readonly pieceId: string;
    readonly orderItemId: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly rotated: boolean;
}

/**
 * Free rectangle for guillotine algorithm
 */
export interface IFreeRectangle extends IRectangle { }

// ==================== ALGORITHM OPTIONS ====================

/**
 * Base algorithm options
 */
export interface IBaseAlgorithmOptions {
    readonly kerf: number;
}

/**
 * 1D algorithm options
 */
export interface I1DAlgorithmOptions extends IBaseAlgorithmOptions {
    readonly minUsableWaste: number;
}

/**
 * 2D algorithm options
 */
export interface I2DAlgorithmOptions extends IBaseAlgorithmOptions {
    readonly allowRotation: boolean;
    readonly respectGrainDirection?: boolean;
}

// ==================== STATISTICS ====================

/**
 * 1D optimization statistics
 */
export interface I1DStatistics {
    readonly totalPieces: number;
    readonly totalStockLength: number;
    readonly totalUsedLength: number;
    readonly efficiency: number;
    readonly totalWaste: number;
    readonly wastePercentage: number;
}

/**
 * 2D optimization statistics
 */
export interface I2DStatistics {
    readonly totalPieces: number;
    readonly totalStockArea: number;
    readonly totalUsedArea: number;
    readonly efficiency: number;
    readonly totalWasteArea: number;
    readonly wastePercentage: number;
}
