/**
 * Export Service
 * Handles PDF and Excel export for cutting plans and reports
 */

import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

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
    position?: { x: number; y: number };
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

const LABELS = {
    tr: {
        title: 'Kesim Planı Raporu',
        planNumber: 'Plan No',
        scenario: 'Senaryo',
        material: 'Malzeme',
        thickness: 'Kalınlık',
        totalWaste: 'Toplam Fire',
        wastePercentage: 'Fire Oranı',
        stockUsed: 'Kullanılan Stok',
        createdAt: 'Oluşturulma Tarihi',
        layoutDetails: 'Kesim Detayları',
        sequence: 'Sıra',
        stockCode: 'Stok Kodu',
        dimensions: 'Boyutlar',
        waste: 'Fire',
        pieces: 'Parçalar',
        code: 'Kod',
        quantity: 'Adet'
    },
    en: {
        title: 'Cutting Plan Report',
        planNumber: 'Plan No',
        scenario: 'Scenario',
        material: 'Material',
        thickness: 'Thickness',
        totalWaste: 'Total Waste',
        wastePercentage: 'Waste %',
        stockUsed: 'Stock Used',
        createdAt: 'Created At',
        layoutDetails: 'Layout Details',
        sequence: 'Seq',
        stockCode: 'Stock Code',
        dimensions: 'Dimensions',
        waste: 'Waste',
        pieces: 'Pieces',
        code: 'Code',
        quantity: 'Qty'
    }
};

export class ExportService implements IExportService {
    async exportPlanToPdf(plan: ICuttingPlanExportData, options: IExportOptions = {}): Promise<Buffer> {
        const lang = options.language ?? 'tr';
        const labels = LABELS[lang];

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ size: 'A4', margin: 50 });

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Title
            doc.fontSize(20).text(labels.title, { align: 'center' });
            doc.moveDown();

            // Plan Info
            doc.fontSize(12);
            doc.text(`${labels.planNumber}: ${plan.planNumber}`);
            doc.text(`${labels.scenario}: ${plan.scenarioName}`);
            doc.text(`${labels.material}: ${plan.materialType}`);
            doc.text(`${labels.thickness}: ${plan.thickness} mm`);
            doc.text(`${labels.totalWaste}: ${plan.totalWaste.toFixed(2)}`);
            doc.text(`${labels.wastePercentage}: ${plan.wastePercentage.toFixed(2)}%`);
            doc.text(`${labels.stockUsed}: ${plan.stockUsedCount}`);
            doc.text(`${labels.createdAt}: ${plan.createdAt.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}`);

            if (options.includeLayouts && plan.layouts.length > 0) {
                doc.moveDown(2);
                doc.fontSize(14).text(labels.layoutDetails, { underline: true });
                doc.moveDown();

                for (const layout of plan.layouts) {
                    doc.fontSize(11);
                    doc.text(`${labels.sequence} ${layout.sequence}: ${layout.stockCode} (${layout.stockDimensions})`);
                    doc.fontSize(10);
                    doc.text(`  ${labels.waste}: ${layout.waste.toFixed(2)} (${layout.wastePercentage.toFixed(2)}%)`);

                    if (options.includePieceDetails && layout.pieces.length > 0) {
                        doc.text(`  ${labels.pieces}:`);
                        for (const piece of layout.pieces) {
                            const codeText = piece.code ? `${piece.code}: ` : '';
                            doc.text(`    - ${codeText}${piece.dimensions} x${piece.quantity}`);
                        }
                    }
                    doc.moveDown(0.5);
                }
            }

            doc.end();
        });
    }

    async exportPlanToExcel(plan: ICuttingPlanExportData, options: IExportOptions = {}): Promise<Buffer> {
        const lang = options.language ?? 'tr';
        const labels = LABELS[lang];

        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            [labels.title],
            [],
            [labels.planNumber, plan.planNumber],
            [labels.scenario, plan.scenarioName],
            [labels.material, plan.materialType],
            [labels.thickness, `${plan.thickness} mm`],
            [labels.totalWaste, plan.totalWaste.toFixed(2)],
            [labels.wastePercentage, `${plan.wastePercentage.toFixed(2)}%`],
            [labels.stockUsed, plan.stockUsedCount],
            [labels.createdAt, plan.createdAt.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');

        // Layouts sheet
        if (options.includeLayouts && plan.layouts.length > 0) {
            const layoutHeaders = [labels.sequence, labels.stockCode, labels.dimensions, labels.waste, labels.wastePercentage];
            const layoutData = [layoutHeaders];

            for (const layout of plan.layouts) {
                layoutData.push([
                    layout.sequence.toString(),
                    layout.stockCode,
                    layout.stockDimensions,
                    layout.waste.toFixed(2),
                    `${layout.wastePercentage.toFixed(2)}%`
                ]);
            }

            const layoutSheet = XLSX.utils.aoa_to_sheet(layoutData);
            XLSX.utils.book_append_sheet(workbook, layoutSheet, 'Kesimler');
        }

        // Pieces sheet
        if (options.includePieceDetails && plan.layouts.length > 0) {
            const pieceHeaders = [labels.sequence, labels.code, labels.dimensions, labels.quantity];
            const pieceData = [pieceHeaders];

            for (const layout of plan.layouts) {
                for (const piece of layout.pieces) {
                    pieceData.push([
                        layout.sequence.toString(),
                        piece.code ?? '-',
                        piece.dimensions,
                        piece.quantity.toString()
                    ]);
                }
            }

            const pieceSheet = XLSX.utils.aoa_to_sheet(pieceData);
            XLSX.utils.book_append_sheet(workbook, pieceSheet, 'Parçalar');
        }

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    async exportMultiplePlansToExcel(plans: ICuttingPlanExportData[], options: IExportOptions = {}): Promise<Buffer> {
        const lang = options.language ?? 'tr';
        const labels = LABELS[lang];

        const workbook = XLSX.utils.book_new();

        // All plans summary
        const summaryHeaders = [
            labels.planNumber,
            labels.scenario,
            labels.material,
            labels.thickness,
            labels.totalWaste,
            labels.wastePercentage,
            labels.stockUsed,
            labels.createdAt
        ];
        const summaryData = [summaryHeaders];

        for (const plan of plans) {
            summaryData.push([
                plan.planNumber,
                plan.scenarioName,
                plan.materialType,
                `${plan.thickness}`,
                plan.totalWaste.toFixed(2),
                `${plan.wastePercentage.toFixed(2)}%`,
                plan.stockUsedCount.toString(),
                plan.createdAt.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')
            ]);
        }

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tüm Planlar');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }
}

export const exportService = new ExportService();
