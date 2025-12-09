/**
 * Guillotine Cutting Strategy
 * 2D cutting optimization algorithm with guillotine constraints
 * Following SRP - Single algorithm implementation
 */
import { I2DAlgorithm, I2DPiece, I2DStock, I2DResult, I2DAlgorithmOptions } from '../../interfaces';
export declare class GuillotineStrategy implements I2DAlgorithm {
    readonly name = "2D_GUILLOTINE";
    readonly type: "2D";
    readonly description = "Guillotine Cutting - Only straight cuts from edge to edge";
    execute(pieces: I2DPiece[], stock: I2DStock[], options: I2DAlgorithmOptions): I2DResult;
    private expandPieces;
    private tryPlaceInActiveSheets;
    private getOrientations;
    private findBestFreeRect;
    private splitFreeRect;
    private tryCreateNewSheet;
    private initializeSheet;
    private addUnplacedPiece;
    private buildResult;
    private emptyResult;
}
//# sourceMappingURL=guillotine.strategy.d.ts.map