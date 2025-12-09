/**
 * Export Service
 * Handles PDF and Excel export for cutting plans and reports
 */
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
    language?: 'tr' | 'en';
}
export interface IExportService {
    exportPlanToPdf(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportPlanToExcel(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportMultiplePlansToExcel(plans: ICuttingPlanExportData[], options?: IExportOptions): Promise<Buffer>;
}
export declare class ExportService implements IExportService {
    exportPlanToPdf(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportPlanToExcel(plan: ICuttingPlanExportData, options?: IExportOptions): Promise<Buffer>;
    exportMultiplePlansToExcel(plans: ICuttingPlanExportData[], options?: IExportOptions): Promise<Buffer>;
}
export declare const exportService: ExportService;
//# sourceMappingURL=export.service.d.ts.map