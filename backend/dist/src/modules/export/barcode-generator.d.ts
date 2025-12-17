/**
 * Barcode/QR Code Generator
 * Generates barcode and QR code SVG for labels and tracking
 */
/** Barcode type */
export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'QR';
/** Barcode generation options */
export interface IBarcodeOptions {
    type: BarcodeType;
    width?: number;
    height?: number;
    margin?: number;
    displayValue?: boolean;
    fontSize?: number;
    background?: string;
    lineColor?: string;
}
/** Barcode output */
export interface IBarcodeOutput {
    svg: string;
    type: BarcodeType;
    data: string;
    width: number;
    height: number;
}
/** Label data for piece/stock */
export interface ILabelData {
    code: string;
    description?: string;
    dimensions?: string;
    quantity?: number;
    date?: Date;
    additionalInfo?: Record<string, string>;
}
export declare class BarcodeGenerator {
    /**
     * Generate barcode SVG
     */
    generateBarcode(data: string, options?: Partial<IBarcodeOptions>): IBarcodeOutput;
    /**
     * Generate CODE128 barcode
     */
    private generateCode128;
    /**
     * Encode data to Code128 binary pattern
     */
    private encodeCode128;
    /**
     * Generate simple QR code (basic implementation)
     */
    private generateQR;
    private drawFinderPattern;
    private isFinderPatternArea;
    private simpleHash;
    /**
     * Generate label with barcode
     */
    generateLabel(data: ILabelData, options?: Partial<IBarcodeOptions>): string;
}
/**
 * Generate barcode SVG
 */
export declare function generateBarcode(data: string, options?: Partial<IBarcodeOptions>): IBarcodeOutput;
/**
 * Generate QR code SVG
 */
export declare function generateQRCode(data: string, size?: number): IBarcodeOutput;
/**
 * Generate label with barcode
 */
export declare function generateLabel(data: ILabelData, options?: Partial<IBarcodeOptions>): string;
//# sourceMappingURL=barcode-generator.d.ts.map