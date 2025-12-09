/**
 * Best Fit Decreasing (BFD) Strategy
 * 1D cutting optimization algorithm
 * Following SRP - Single algorithm implementation
 */
import { I1DAlgorithm, I1DPiece, I1DStock, I1DResult, I1DAlgorithmOptions } from '../../interfaces';
export declare class BFDStrategy implements I1DAlgorithm {
    readonly name = "1D_BFD";
    readonly type: "1D";
    readonly description = "Best Fit Decreasing - Places each piece in the bar with least remaining space";
    execute(pieces: I1DPiece[], stock: I1DStock[], options: I1DAlgorithmOptions): I1DResult;
    private expandPieces;
    private tryPlaceInBestBar;
    private tryCreateNewBar;
    private addUnplacedPiece;
    private buildResult;
    private emptyResult;
}
//# sourceMappingURL=bfd.strategy.d.ts.map