/**
 * Layout SVG Generator
 * Creates SVG visualizations of cutting plans for 2D sheets
 * Follows Single Responsibility Principle - only handles SVG generation
 */
export interface ILayoutPiece {
    pieceId: string;
    orderItemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    label?: string;
}
export interface ILayoutSheet {
    sheetWidth: number;
    sheetHeight: number;
    pieces: ILayoutPiece[];
    waste?: number;
    wastePercentage?: number;
}
export interface ISvgOptions {
    /** Scale factor (pixels per mm). Default: 0.5 */
    scale?: number;
    /** Padding around the diagram (px). Default: 20 */
    padding?: number;
    /** Show piece labels. Default: true */
    showLabels?: boolean;
    /** Show dimensions. Default: true */
    showDimensions?: boolean;
    /** Color for placed pieces. Default: #4CAF50 */
    pieceColor?: string;
    /** Color for waste area. Default: #ffebee */
    wasteColor?: string;
    /** Color for sheet border. Default: #333333 */
    borderColor?: string;
    /** Font size for labels. Default: 10 */
    fontSize?: number;
}
/**
 * Generate SVG visualization for a cutting layout
 */
export declare function generateLayoutSvg(layout: ILayoutSheet, options?: ISvgOptions): string;
/**
 * Generate multiple SVG layouts as a single combined SVG
 */
export declare function generateMultipleLayoutsSvg(layouts: ILayoutSheet[], options?: ISvgOptions): string;
/**
 * Convert SVG to data URL for embedding
 */
export declare function svgToDataUrl(svg: string): string;
/**
 * Layout SVG Generator class for dependency injection
 */
export declare class LayoutSvgGenerator {
    private readonly defaultOptions;
    constructor(defaultOptions?: ISvgOptions);
    generate(layout: ILayoutSheet): string;
    generateMultiple(layouts: ILayoutSheet[]): string;
    toDataUrl(svg: string): string;
}
//# sourceMappingURL=layout-svg-generator.d.ts.map