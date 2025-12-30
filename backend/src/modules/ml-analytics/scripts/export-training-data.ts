#!/usr/bin/env ts-node
/**
 * Export Training Data CLI
 * Extracts production data for ML model training
 * 
 * Usage: npx ts-node scripts/export-training-data.ts [--output-dir ./data]
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and, isNotNull, desc } from 'drizzle-orm';
import { Pool } from 'pg';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { cuttingPlans, optimizationScenarios } from '../../../db/schema/optimization';
import { productionLogs, downtimeLogs } from '../../../db/schema/production';
import { cuttingJobItems } from '../../../db/schema/cutting-job';
import { orderItems } from '../../../db/schema/order';

// ==================== TYPES ====================

interface IWasteTrainingRecord {
    // Features (19 total - matching waste-predictor.model.ts FEATURE_ORDER)
    totalPieceCount: number;
    uniquePieceCount: number;
    avgPieceArea: number;
    pieceAreaStdDev: number;
    minPieceArea: number;
    maxPieceArea: number;
    pieceAspectRatioMean: number;
    pieceAspectRatioStdDev: number;
    totalStockArea: number;
    stockSheetCount: number;
    avgStockArea: number;
    stockAspectRatio: number;
    totalDemandToStockRatio: number;
    pieceToStockSizeRatio: number;
    kerf: number;
    allowRotation: number;
    materialTypeIndex: number;
    historicalAvgWaste: number;
    lastJobWaste: number;
    // Label
    actualWastePercent: number;
}

interface IAlgorithmTrainingRecord {
    // Features (14 total - matching algorithm-selector.model.ts FEATURE_ORDER)
    pieceSizeVariance: number;
    smallPieceRatio: number;
    largePieceRatio: number;
    squarePieceRatio: number;
    uniqueShapeCount: number;
    rotationAllowed: number;
    grainConstraintRatio: number;
    stockVariety: number;
    standardSizeRatio: number;
    bottomLeftHistoricalWaste: number;
    guillotineHistoricalWaste: number;
    maxrectsHistoricalWaste: number;
    totalPieceCount: number;
    totalStockCount: number;
    // Label
    bestAlgorithm: string;
    wasteResult: number;
}

interface ITimeTrainingRecord {
    // Features (12 total - matching time-estimator.model.ts FEATURE_ORDER)
    totalPieces: number;
    totalCuts: number;
    wastePercentage: number;
    stockUsedCount: number;
    machineType: number;
    machineSpeed: number;
    materialTypeIndex: number;
    thickness: number;
    averagePieceArea: number;
    maxPieceArea: number;
    operatorAvgTime: number;
    machineAvgTime: number;
    // Label
    actualTimeMinutes: number;
}

interface IAnomalyTrainingRecord {
    // Features (12 total - matching anomaly-predictor.model.ts FEATURE_ORDER)
    currentWaste: number;
    currentTime: number;
    currentEfficiency: number;
    wasteDeviation: number;
    timeDeviation: number;
    efficiencyDeviation: number;
    recentAnomalyCount: number;
    avgHistoricalWaste: number;
    avgHistoricalTime: number;
    dayOfWeek: number;
    hourOfDay: number;
    isWeekend: number;
    // Label
    hadAnomaly: number;
    anomalyType: string | null;
}

interface IExportResult {
    wasteRecords: IWasteTrainingRecord[];
    algorithmRecords: IAlgorithmTrainingRecord[];
    timeRecords: ITimeTrainingRecord[];
    anomalyRecords: IAnomalyTrainingRecord[];
}

// ==================== HELPER FUNCTIONS ====================

interface JobItem {
    quantity: number;
    width: number | null;
    height: number | null;
    length: number | null;
}

function calculatePieceAreas(jobItems: JobItem[]): number[] {
    return jobItems.map(item => {
        const width = item.width ?? item.length ?? 100;
        const height = item.height ?? 100;
        return width * height;
    });
}

function calculateAspectRatios(jobItems: JobItem[]): number[] {
    return jobItems.map(item => {
        const width = item.width ?? item.length ?? 100;
        const height = item.height ?? 100;
        return Math.max(width, height) / Math.max(Math.min(width, height), 1);
    });
}

function calculateMean(values: number[]): number {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const variance = values.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

// ==================== DATABASE CONNECTION ====================

async function createDbConnection(): Promise<ReturnType<typeof drizzle>> {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    return drizzle(pool);
}


// ==================== DATA EXTRACTION ====================

async function extractWasteTrainingData(db: ReturnType<typeof drizzle>): Promise<IWasteTrainingRecord[]> {
    console.log('📊 Extracting waste training data...');

    // Query completed production logs with cutting plans
    const results = await db
        .select({
            planId: cuttingPlans.id,
            estimatedWaste: cuttingPlans.wastePercentage,
            stockUsedCount: cuttingPlans.stockUsedCount,
            actualWaste: productionLogs.actualWaste,
            actualTime: productionLogs.actualTime,
            completedAt: productionLogs.completedAt,
            jobId: optimizationScenarios.cuttingJobId,
            parameters: optimizationScenarios.parameters
        })
        .from(productionLogs)
        .innerJoin(cuttingPlans, eq(productionLogs.cuttingPlanId, cuttingPlans.id))
        .innerJoin(optimizationScenarios, eq(cuttingPlans.scenarioId, optimizationScenarios.id))
        .where(
            and(
                isNotNull(productionLogs.actualWaste),
                isNotNull(productionLogs.completedAt)
            )
        )
        .orderBy(desc(productionLogs.completedAt))
        .limit(5000);

    const records: IWasteTrainingRecord[] = [];

    for (const row of results) {
        // Get job items for this record
        // Get job items with dimensions
        const jobItems = await db
            .select({
                quantity: cuttingJobItems.quantity,
                width: orderItems.width,
                height: orderItems.height,
                length: orderItems.length
            })
            .from(cuttingJobItems)
            .innerJoin(orderItems, eq(cuttingJobItems.orderItemId, orderItems.id))
            .where(eq(cuttingJobItems.cuttingJobId, row.jobId));


        // Calculate features using helper functions
        const totalPieceCount = jobItems.reduce((sum, item) => sum + item.quantity, 0);
        const uniquePieceCount = jobItems.length;

        const pieceAreas = calculatePieceAreas(jobItems);
        const avgPieceArea = calculateMean(pieceAreas);
        const pieceAreaStdDev = calculateStdDev(pieceAreas, avgPieceArea);
        const minPieceArea = pieceAreas.length > 0 ? Math.min(...pieceAreas) : 0;
        const maxPieceArea = pieceAreas.length > 0 ? Math.max(...pieceAreas) : 0;

        const pieceAspectRatios = calculateAspectRatios(jobItems);
        const pieceAspectRatioMean = pieceAspectRatios.length > 0 ? calculateMean(pieceAspectRatios) : 1;
        const pieceAspectRatioStdDev = calculateStdDev(pieceAspectRatios, pieceAspectRatioMean);


        // Stock calculations (estimated from stockUsedCount)
        const stockSheetCount = row.stockUsedCount;
        const standardSheetWidth = 2440;
        const standardSheetHeight = 1220;
        const avgStockArea = standardSheetWidth * standardSheetHeight;
        const totalStockArea = stockSheetCount * avgStockArea;
        const stockAspectRatio = standardSheetWidth / standardSheetHeight;

        // Demand/Stock ratios
        const totalDemand = pieceAreas.reduce((sum, a) => sum + a, 0) * totalPieceCount / uniquePieceCount;
        const totalDemandToStockRatio = totalStockArea > 0 ? totalDemand / totalStockArea : 0.7;
        const pieceToStockSizeRatio = avgStockArea > 0 ? avgPieceArea / avgStockArea : 0.1;

        // Parse parameters
        const params = row.parameters as Record<string, unknown>;
        const kerf = (params?.kerf as number) ?? 3;
        const allowRotation = (params?.allowRotation as boolean) ? 1 : 0;

        // Historical (use estimated waste as proxy)
        const historicalAvgWaste = row.estimatedWaste;
        const lastJobWaste = row.estimatedWaste * 0.9; // Approximate

        records.push({
            totalPieceCount,
            uniquePieceCount,
            avgPieceArea,
            pieceAreaStdDev,
            minPieceArea,
            maxPieceArea,
            pieceAspectRatioMean,
            pieceAspectRatioStdDev,
            totalStockArea,
            stockSheetCount,
            avgStockArea,
            stockAspectRatio,
            totalDemandToStockRatio,
            pieceToStockSizeRatio,
            kerf,
            allowRotation,
            materialTypeIndex: 0, // Would need material mapping
            historicalAvgWaste,
            lastJobWaste,
            actualWastePercent: row.actualWaste ?? 0
        });
    }

    console.log(`   Found ${records.length} waste training records`);
    return records;
}

async function extractAlgorithmTrainingData(db: ReturnType<typeof drizzle>): Promise<IAlgorithmTrainingRecord[]> {
    console.log('🎯 Extracting algorithm training data...');

    // Query completed scenarios with their waste results
    const results = await db
        .select({
            scenarioId: optimizationScenarios.id,
            jobId: optimizationScenarios.cuttingJobId,
            parameters: optimizationScenarios.parameters,
            wastePercentage: cuttingPlans.wastePercentage,
            stockUsedCount: cuttingPlans.stockUsedCount
        })
        .from(optimizationScenarios)
        .innerJoin(cuttingPlans, eq(cuttingPlans.scenarioId, optimizationScenarios.id))
        .where(isNotNull(cuttingPlans.wastePercentage))
        .orderBy(desc(optimizationScenarios.createdAt))
        .limit(3000);

    const records: IAlgorithmTrainingRecord[] = [];

    for (const row of results) {
        // Get job items for feature extraction
        const jobItems = await db
            .select({
                quantity: cuttingJobItems.quantity,
                width: orderItems.width,
                height: orderItems.height,
                length: orderItems.length,
                canRotate: orderItems.canRotate,
                grainDirection: orderItems.grainDirection
            })
            .from(cuttingJobItems)
            .innerJoin(orderItems, eq(cuttingJobItems.orderItemId, orderItems.id))
            .where(eq(cuttingJobItems.cuttingJobId, row.jobId));

        if (jobItems.length === 0) continue;

        // Calculate features
        const areas = calculatePieceAreas(jobItems);
        const aspectRatios = calculateAspectRatios(jobItems);
        const meanArea = calculateMean(areas);
        const stdDevArea = calculateStdDev(areas, meanArea);
        const totalPieces = jobItems.reduce((sum, item) => sum + item.quantity, 0);

        const smallPieceRatio = areas.filter(a => a < meanArea * 0.5).length / areas.length;
        const largePieceRatio = areas.filter(a => a > meanArea * 2).length / areas.length;
        const squarePieceRatio = aspectRatios.filter(ar => ar < 1.5).length / aspectRatios.length;
        const grainConstrained = jobItems.filter(i => i.grainDirection && i.grainDirection !== 'none').length;
        const rotationAllowed = jobItems.filter(i => i.canRotate === true).length > 0 ? 1 : 0;

        records.push({
            pieceSizeVariance: stdDevArea / (meanArea || 1),
            smallPieceRatio,
            largePieceRatio,
            squarePieceRatio,
            uniqueShapeCount: new Set(areas.map(a => Math.floor(a / 1000))).size,
            rotationAllowed,
            grainConstraintRatio: grainConstrained / jobItems.length,
            stockVariety: row.stockUsedCount ?? 1,
            standardSizeRatio: 0.5, // Would need standard size lookup
            bottomLeftHistoricalWaste: 15, // Default or from historical data
            guillotineHistoricalWaste: 15,
            maxrectsHistoricalWaste: 15,
            totalPieceCount: totalPieces,
            totalStockCount: row.stockUsedCount ?? 1,
            bestAlgorithm: (row.parameters as { algorithm?: string })?.algorithm ?? 'BOTTOM_LEFT',
            wasteResult: row.wastePercentage ?? 15
        });
    }

    console.log(`   Found ${records.length} algorithm training records`);
    return records;
}

async function extractTimeTrainingData(db: ReturnType<typeof drizzle>): Promise<ITimeTrainingRecord[]> {
    console.log('⏱️  Extracting time estimation training data...');

    const results = await db
        .select({
            stockUsedCount: cuttingPlans.stockUsedCount,
            estimatedWaste: cuttingPlans.wastePercentage,
            actualTime: productionLogs.actualTime,
            machineId: cuttingPlans.machineId
        })
        .from(productionLogs)
        .innerJoin(cuttingPlans, eq(productionLogs.cuttingPlanId, cuttingPlans.id))
        .where(
            and(
                isNotNull(productionLogs.actualTime),
                isNotNull(productionLogs.completedAt)
            )
        )
        .limit(5000);

    const records: ITimeTrainingRecord[] = results.map(row => {
        // Estimated values (would need more joins for accurate data)
        const totalPieces = row.stockUsedCount * 10; // Estimation
        const totalCuts = totalPieces * 4; // 4 cuts per piece avg
        const avgPieceArea = 500 * 300; // Default piece size
        const maxPieceArea = 800 * 600; // Larger piece

        return {
            totalPieces,
            totalCuts,
            wastePercentage: row.estimatedWaste,
            stockUsedCount: row.stockUsedCount,
            machineType: row.machineId ? 1 : 0, // 0=manual, 1=CNC
            machineSpeed: 1, // Default speed factor
            materialTypeIndex: 0, // Would need material data
            thickness: 5, // Default thickness
            averagePieceArea: avgPieceArea,
            maxPieceArea: maxPieceArea,
            operatorAvgTime: 60, // Default 60 min baseline
            machineAvgTime: row.actualTime ?? 45, // Use actual or default
            actualTimeMinutes: row.actualTime ?? 0
        };
    });

    console.log(`   Found ${records.length} time training records`);
    return records;
}

async function extractAnomalyTrainingData(db: ReturnType<typeof drizzle>): Promise<IAnomalyTrainingRecord[]> {
    console.log('🔍 Extracting anomaly training data...');

    const results = await db
        .select({
            logId: productionLogs.id,
            actualWaste: productionLogs.actualWaste,
            actualTime: productionLogs.actualTime,
            completedAt: productionLogs.completedAt,
            issues: productionLogs.issues,
            estimatedWaste: cuttingPlans.wastePercentage
        })
        .from(productionLogs)
        .innerJoin(cuttingPlans, eq(productionLogs.cuttingPlanId, cuttingPlans.id))
        .where(isNotNull(productionLogs.completedAt))
        .limit(5000);

    // Calculate averages for deviation
    const avgWaste = results.reduce((sum, r) => sum + (r.actualWaste ?? 0), 0) / results.length || 15;
    const avgTime = results.reduce((sum, r) => sum + (r.actualTime ?? 0), 0) / results.length || 60;

    const records: IAnomalyTrainingRecord[] = [];

    for (const row of results) {
        // Check for downtime
        const downtimes = await db
            .select()
            .from(downtimeLogs)
            .where(eq(downtimeLogs.productionLogId, row.logId));

        const hadDowntime = downtimes.length > 0;
        const wasteDeviation = ((row.actualWaste ?? 0) - avgWaste) / avgWaste;
        const timeDeviation = ((row.actualTime ?? 0) - avgTime) / avgTime;

        // Determine if this was an anomaly
        const hadAnomaly = hadDowntime || wasteDeviation > 0.5 || timeDeviation > 0.5;

        let anomalyType: string | null = null;
        if (wasteDeviation > 0.5) anomalyType = 'high_waste';
        else if (timeDeviation > 0.5) anomalyType = 'slow_production';
        else if (hadDowntime) anomalyType = 'machine_issue';

        const completedDate = row.completedAt ? new Date(row.completedAt) : new Date();

        records.push({
            currentWaste: row.actualWaste ?? 0,
            currentTime: row.actualTime ?? 0,
            currentEfficiency: 1 - (row.actualWaste ?? 0) / 100, // Efficiency = 1 - wastePercent
            wasteDeviation,
            timeDeviation,
            efficiencyDeviation: 0,
            recentAnomalyCount: 0,
            avgHistoricalWaste: avgWaste,
            avgHistoricalTime: avgTime,
            dayOfWeek: completedDate.getDay(),
            hourOfDay: completedDate.getHours(),
            isWeekend: completedDate.getDay() === 0 || completedDate.getDay() === 6 ? 1 : 0,
            hadAnomaly: hadAnomaly ? 1 : 0,
            anomalyType
        });
    }

    console.log(`   Found ${records.length} anomaly training records`);
    return records;
}

// ==================== EXPORT ====================

async function exportToJson(data: IExportResult, outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // Export each dataset
    await fs.writeFile(
        path.join(outputDir, 'waste_training_data.json'),
        JSON.stringify(data.wasteRecords, null, 2)
    );
    console.log(`✅ Exported ${data.wasteRecords.length} waste records`);

    await fs.writeFile(
        path.join(outputDir, 'time_training_data.json'),
        JSON.stringify(data.timeRecords, null, 2)
    );
    console.log(`✅ Exported ${data.timeRecords.length} time records`);

    await fs.writeFile(
        path.join(outputDir, 'anomaly_training_data.json'),
        JSON.stringify(data.anomalyRecords, null, 2)
    );
    console.log(`✅ Exported ${data.anomalyRecords.length} anomaly records`);

    // Summary
    const summary = {
        exportedAt: new Date().toISOString(),
        counts: {
            waste: data.wasteRecords.length,
            algorithm: data.algorithmRecords.length,
            time: data.timeRecords.length,
            anomaly: data.anomalyRecords.length
        }
    };
    await fs.writeFile(
        path.join(outputDir, 'export_summary.json'),
        JSON.stringify(summary, null, 2)
    );
}

// ==================== MAIN ====================

// Using IIFE pattern - top-level await requires ES2022 module which breaks commonjs compatibility
(async () => { // NOSONAR - S7785: IIFE is intentional for commonjs compatibility
    console.log('🚀 ML Training Data Export\n');

    const outputDir = process.argv[2] || './src/modules/ml-analytics/training/data';

    try {
        const db = await createDbConnection();

        const exportData: IExportResult = {
            wasteRecords: await extractWasteTrainingData(db),
            algorithmRecords: await extractAlgorithmTrainingData(db),
            timeRecords: await extractTimeTrainingData(db),
            anomalyRecords: await extractAnomalyTrainingData(db)
        };

        await exportToJson(exportData, outputDir);

        console.log(`\n✅ Export complete! Data saved to: ${outputDir}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
    }
})();
