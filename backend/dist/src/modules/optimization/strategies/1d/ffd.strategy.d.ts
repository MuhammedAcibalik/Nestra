/**
 * First Fit Decreasing (FFD) Strategy
 * 1D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
import { I1DAlgorithm, I1DPiece, I1DStock, I1DResult, I1DAlgorithmOptions } from '../../interfaces';
export declare class FFDStrategy implements I1DAlgorithm {
    readonly name = "1D_FFD";
    readonly type: "1D";
    readonly description = "First Fit Decreasing - Places each piece in the first bar that fits";
    execute(pieces: I1DPiece[], stock: I1DStock[], options: I1DAlgorithmOptions): I1DResult;
    private expandPieces;
    private tryPlaceInExistingBar;
    private tryCreateNewBar;
    private addUnplacedPiece;
    private buildResult;
    private emptyResult;
}
//# sourceMappingURL=ffd.strategy.d.ts.map