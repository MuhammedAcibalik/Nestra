/**
 * Bottom-Left Fill Strategy
 * 2D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
import { I2DAlgorithm, I2DPiece, I2DStock, I2DResult, I2DAlgorithmOptions } from '../../interfaces';
export declare class BottomLeftStrategy implements I2DAlgorithm {
    readonly name = "2D_BOTTOM_LEFT";
    readonly type: "2D";
    readonly description = "Bottom-Left Fill - Places pieces at the lowest available position";
    execute(pieces: I2DPiece[], stock: I2DStock[], options: I2DAlgorithmOptions): I2DResult;
    private expandPieces;
    private tryPlaceInActiveSheets;
    private getOrientations;
    private findBottomLeftPosition;
    private canPlace;
    private rectanglesOverlap;
    private tryCreateNewSheet;
    private addUnplacedPiece;
    private buildResult;
    private emptyResult;
}
//# sourceMappingURL=bottom-left.strategy.d.ts.map