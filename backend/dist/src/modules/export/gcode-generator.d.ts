/**
 * G-code Generator for CNC Machines
 * Generates CNC machine code for cutting operations
 */
/** G-code generation options */
export interface IGcodeOptions {
    /** Feed rate for cutting (mm/min) */
    feedRate: number;
    /** Rapid move rate (mm/min) */
    rapidRate: number;
    /** Spindle speed (RPM) */
    spindleSpeed: number;
    /** Cutting depth (mm) */
    cuttingDepth: number;
    /** Safe Z height (mm) */
    safeZ: number;
    /** Work Z height (mm) - cutting position */
    workZ: number;
    /** Tool diameter (mm) */
    toolDiameter: number;
    /** Use relative coordinates */
    relativeCoords?: boolean;
    /** Add comments to G-code */
    includeComments?: boolean;
    /** Machine type for specific syntax */
    machineType?: 'GENERIC' | 'FANUC' | 'HAAS' | 'MACH3';
}
/** Cutting path for a single piece */
export interface ICuttingPath {
    pieceId: string;
    pieceCode?: string;
    /** Start point */
    startX: number;
    startY: number;
    /** Width and height of rectangle */
    width: number;
    height: number;
    /** Rotation angle in degrees */
    rotation?: number;
}
/** Sheet with cutting paths */
export interface ICuttingSheet {
    sheetId: string;
    sheetCode: string;
    sheetWidth: number;
    sheetHeight: number;
    paths: ICuttingPath[];
}
/** G-code output */
export interface IGcodeOutput {
    content: string;
    lineCount: number;
    estimatedTime: number;
    filename: string;
}
export declare class GcodeGenerator {
    private options;
    private lines;
    private totalDistance;
    constructor(options?: Partial<IGcodeOptions>);
    /**
     * Generate G-code for a cutting sheet
     */
    generateForSheet(sheet: ICuttingSheet): IGcodeOutput;
    /**
     * Generate G-code for multiple sheets
     */
    generateForMultipleSheets(sheets: ICuttingSheet[]): IGcodeOutput[];
    private addHeader;
    private addInitialization;
    private addCuttingPath;
    private addFooter;
    private calculateEstimatedTime;
}
/**
 * Generate G-code string for a sheet
 */
export declare function generateGcode(sheet: ICuttingSheet, options?: Partial<IGcodeOptions>): IGcodeOutput;
/**
 * Generate G-code for multiple sheets
 */
export declare function generateMultipleGcode(sheets: ICuttingSheet[], options?: Partial<IGcodeOptions>): IGcodeOutput[];
//# sourceMappingURL=gcode-generator.d.ts.map