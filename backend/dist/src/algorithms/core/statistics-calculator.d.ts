/**
 * Statistics Calculator
 * Calculates optimization metrics (waste, efficiency)
 * Single Responsibility: Only handles statistics computation
 */
import { IActiveBar, IActiveSheet, I1DStatistics, I2DStatistics } from './types';
/**
 * Calculate 1D optimization statistics
 */
export declare function calculate1DStatistics(activeBars: readonly IActiveBar[], totalPiecesPlaced: number): I1DStatistics;
/**
 * Calculate 2D optimization statistics
 */
export declare function calculate2DStatistics(activeSheets: readonly IActiveSheet[], totalPiecesPlaced: number): I2DStatistics;
/**
 * Calculate waste for a single 1D bar
 */
export declare function calculateBarWaste(bar: IActiveBar): {
    waste: number;
    wastePercentage: number;
};
/**
 * Calculate waste for a single 2D sheet
 */
export declare function calculateSheetWaste(sheet: IActiveSheet): {
    wasteArea: number;
    wastePercentage: number;
    usedArea: number;
};
//# sourceMappingURL=statistics-calculator.d.ts.map