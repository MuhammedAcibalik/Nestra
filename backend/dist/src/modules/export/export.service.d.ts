/**
 * Export Service
 * Handles PDF and Excel export for cutting plans and reports
 */
import { IGcodeOptions, IGcodeOutput } from './gcode-generator';
import { IBarcodeOptions, IBarcodeOutput, ILabelData } from './barcode-generator';
export interface ICuttingPlanExportData {
    planNumber: string;
    scenarioName: string;
    materialType: string;
    thickness: number;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    createdAt: Date;
    layouts: ILayoutExportData[];
}
export interface ILayoutExportData {
    sequence: number;
    stockCode: string;
    stockDimensions: string;
    waste: number;
    wastePercentage: number;
    pieces: IPieceExportData[];
}
export interface IPieceExportData {
    code?: string;
    dimensions: string;
    quantity: number;
    position?: {
        x: number;
        y: number;
    };
}
export interface IExportOptions {
    includeLayouts?: boolean;
    includePieceDetails?: boolean;
    includeVisualLayout?: boolean;
    language?: 'tr' | 'en';
}
/** G-code export options (extends machine options) */
export interface IGcodeExportOptions extends Partial<IGcodeOptions> {
    /** Generate separate files per sheet */
    separateFiles?: boolean;
}
export interface IExportService {
    exportPlanToPdf(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportPlanToExcel(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportMultiplePlansToExcel(plans: ICuttingPlanExportData[], options?: IExportOptions): Promise<Buffer>;
    exportLayoutToSvg(layout: ILayoutExportData, sheetDimensions: {
        width: number;
        height: number;
    }): string;
    exportPlanToGcode(plan: ICuttingPlanExportData, options?: IGcodeExportOptions): IGcodeOutput[];
    generatePieceLabels(pieces: ILabelData[], options?: Partial<IBarcodeOptions>): string[];
    generateBarcode(data: string, options?: Partial<IBarcodeOptions>): IBarcodeOutput;
}
export declare class ExportService implements IExportService {
    exportPlanToPdf(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportPlanToExcel(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportMultiplePlansToExcel(plans: ICuttingPlanExportData[], options?: IExportOptions): Promise<Buffer>;
    /**
     * Export a single layout to SVG visualization
     */
    exportLayoutToSvg(layout: ILayoutExportData, sheetDimensions: {
        width: number;
        height: number;
    }): string;
    /**
     * Parse width from dimensions string (e.g., "500x300" -> 500)
     */
    private parseDimensionWidth;
    /**
     * Parse height from dimensions string (e.g., "500x300" -> 300)
     */
    private parseDimensionHeight;
    /**
     * Export cutting plan to G-code for CNC machines
     */
    exportPlanToGcode(plan: ICuttingPlanExportData, options?: IGcodeExportOptions): IGcodeOutput[];
    /**
     * Generate piece labels with barcodes
     */
    generatePieceLabels(pieces: ILabelData[], options?: Partial<IBarcodeOptions>): string[];
    /**
     * Generate a single barcode
     */
    generateBarcode(data: string, options?: Partial<IBarcodeOptions>): IBarcodeOutput;
}
export declare const exportService: ExportService;
//# sourceMappingURL=export.service.d.ts.map