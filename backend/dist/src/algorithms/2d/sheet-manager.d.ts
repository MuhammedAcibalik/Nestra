/**
 * 2D Sheet Manager
 * Manages active sheets during 2D cutting optimization
 * Single Responsibility: Only handles sheet state operations
 */
import { IActiveSheet, IFreeRectangle, IExpanded2DPiece, IPosition, I2DAlgorithmOptions } from '../core/types';
/**
 * Create a new active sheet with initial piece at origin
 */
export declare function createActiveSheet(stockId: string, stockWidth: number, stockHeight: number, piece: IExpanded2DPiece, rotated: boolean): IActiveSheet;
/**
 * Create a new sheet with guillotine tracking
 */
export declare function createGuillotineSheet(stockId: string, stockWidth: number, stockHeight: number, piece: IExpanded2DPiece, rotated: boolean, kerf: number): IActiveSheet;
/**
 * Check if a piece can be placed at a position
 */
export declare function canPlaceAt(sheet: IActiveSheet, pos: IPosition, width: number, height: number, kerf: number): boolean;
/**
 * Find bottom-left position for a piece in a sheet
 */
export declare function findBottomLeftPosition(sheet: IActiveSheet, width: number, height: number, kerf: number): IPosition | null;
/**
 * Try to place piece in sheet using Bottom-Left strategy
 */
export declare function tryPlaceBottomLeft(sheet: IActiveSheet, piece: IExpanded2DPiece, options: I2DAlgorithmOptions): boolean;
/**
 * Find best fit rectangle for guillotine placement
 */
export declare function findBestGuillotineFit(freeRects: readonly IFreeRectangle[], width: number, height: number, canRotate: boolean, allowRotation: boolean): {
    index: number;
    width: number;
    height: number;
    rotated: boolean;
} | null;
/**
 * Split free rectangle after placement (guillotine)
 */
export declare function splitFreeRectangle(rect: IFreeRectangle, placedWidth: number, placedHeight: number, kerf: number): IFreeRectangle[];
/**
 * Try to place piece in sheet using Guillotine strategy
 */
export declare function tryPlaceGuillotine(sheet: IActiveSheet, piece: IExpanded2DPiece, options: I2DAlgorithmOptions): boolean;
//# sourceMappingURL=sheet-manager.d.ts.map