"use strict";
/**
 * Enhanced 2D Algorithm Tests
 * Testing new MAXRECTS implementation with all improvements
 */
Object.defineProperty(exports, "__esModule", { value: true });
const enhanced_optimizer_1 = require("../enhanced-optimizer");
// ==================== TEST DATA GENERATORS ====================
function generateCabinetPanels() {
    return [
        { id: 'side-1', width: 580, height: 720, quantity: 8, orderItemId: 'cabinet-1', canRotate: true },
        { id: 'side-2', width: 580, height: 850, quantity: 4, orderItemId: 'cabinet-1', canRotate: true },
        { id: 'top-1', width: 580, height: 560, quantity: 8, orderItemId: 'cabinet-2', canRotate: true },
        { id: 'bottom-1', width: 580, height: 560, quantity: 8, orderItemId: 'cabinet-2', canRotate: true },
        { id: 'back-1', width: 560, height: 700, quantity: 8, orderItemId: 'cabinet-3', canRotate: true },
        { id: 'shelf-1', width: 560, height: 350, quantity: 16, orderItemId: 'cabinet-4', canRotate: true },
        { id: 'shelf-2', width: 460, height: 300, quantity: 12, orderItemId: 'cabinet-4', canRotate: true },
        { id: 'drawer-1', width: 450, height: 400, quantity: 12, orderItemId: 'cabinet-5', canRotate: true },
        { id: 'drawer-2', width: 350, height: 400, quantity: 8, orderItemId: 'cabinet-5', canRotate: true },
        { id: 'small-1', width: 200, height: 150, quantity: 20, orderItemId: 'cabinet-6', canRotate: true },
    ];
}
function generateMetalParts() {
    return [
        { id: 'base-1', width: 800, height: 600, quantity: 4, orderItemId: 'machine-1', canRotate: true },
        { id: 'base-2', width: 500, height: 400, quantity: 6, orderItemId: 'machine-1', canRotate: true },
        { id: 'panel-1', width: 600, height: 800, quantity: 8, orderItemId: 'machine-2', canRotate: true },
        { id: 'panel-2', width: 400, height: 600, quantity: 10, orderItemId: 'machine-2', canRotate: true },
        { id: 'bracket-1', width: 200, height: 300, quantity: 24, orderItemId: 'machine-3', canRotate: true },
        { id: 'bracket-2', width: 150, height: 200, quantity: 32, orderItemId: 'machine-3', canRotate: true },
        { id: 'small-1', width: 100, height: 150, quantity: 50, orderItemId: 'machine-4', canRotate: true },
        { id: 'small-2', width: 80, height: 120, quantity: 40, orderItemId: 'machine-4', canRotate: true },
    ];
}
function generateHighVolumeSmall() {
    return [
        { id: 'small-a', width: 200, height: 150, quantity: 100, orderItemId: 'batch', canRotate: true },
        { id: 'small-b', width: 180, height: 120, quantity: 80, orderItemId: 'batch', canRotate: true },
        { id: 'small-c', width: 150, height: 100, quantity: 120, orderItemId: 'batch', canRotate: true },
    ];
}
function generatePlywoodStock() {
    return [
        { id: 'ply-1', width: 2440, height: 1220, available: 20, unitPrice: 50 },
        { id: 'ply-2', width: 2440, height: 1220, available: 20, unitPrice: 50 },
        { id: 'ply-half-1', width: 1220, height: 1220, available: 10, unitPrice: 25 },
    ];
}
function generateMetalStock() {
    return [
        { id: 'steel-1', width: 2500, height: 1250, available: 15, unitPrice: 150 },
        { id: 'steel-2', width: 2500, height: 1250, available: 15, unitPrice: 150 },
        { id: 'steel-lg-1', width: 3000, height: 1500, available: 8, unitPrice: 250 },
    ];
}
const testScenarios = [
    {
        name: 'Kitchen Cabinets - MAXRECTS_BEST',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS_BEST', kerf: 3, allowRotation: true },
        oldEfficiency: 83.30,
        expectedImprovement: 5
    },
    {
        name: 'Metal Industrial - MAXRECTS_BEST',
        pieces: generateMetalParts(),
        stock: generateMetalStock(),
        options: { algorithm: 'MAXRECTS_BEST', kerf: 2, allowRotation: true },
        oldEfficiency: 71.63,
        expectedImprovement: 8
    },
    {
        name: 'High Volume Small - MAXRECTS_BEST',
        pieces: generateHighVolumeSmall(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS_BEST', kerf: 3, allowRotation: true },
        oldEfficiency: 73.10,
        expectedImprovement: 10
    },
    {
        name: 'Cabinets - BSSF Heuristic',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS', heuristic: 'BSSF', kerf: 3, allowRotation: true },
        oldEfficiency: 83.30,
        expectedImprovement: 3
    },
    {
        name: 'Cabinets - BAF Heuristic',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS', heuristic: 'BAF', kerf: 3, allowRotation: true },
        oldEfficiency: 83.30,
        expectedImprovement: 3
    },
    {
        name: 'Cabinets - Short Side Sort',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS_BEST', kerf: 3, sortStrategy: 'SHORT_SIDE' },
        oldEfficiency: 83.30,
        expectedImprovement: 2
    },
    {
        name: 'High Volume - Perimeter Sort',
        pieces: generateHighVolumeSmall(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'MAXRECTS_BEST', kerf: 3, sortStrategy: 'PERIMETER' },
        oldEfficiency: 73.10,
        expectedImprovement: 5
    }
];
// ==================== TEST RUNNER ====================
function runEnhancedTests() {
    console.log('\n' + '🔥'.repeat(30));
    console.log('   ENHANCED 2D OPTIMIZATION TESTS');
    console.log('🔥'.repeat(30));
    let totalOldEfficiency = 0;
    let totalNewEfficiency = 0;
    const results = [];
    for (const scenario of testScenarios) {
        console.log('\n' + '='.repeat(60));
        console.log(`📋 ${scenario.name}`);
        console.log('='.repeat(60));
        try {
            const result = (0, enhanced_optimizer_1.optimize2DEnhanced)(scenario.pieces, scenario.stock, scenario.options);
            const newEff = result.statistics.efficiency;
            const improvement = newEff - scenario.oldEfficiency;
            console.log(`\n📊 Results:`);
            console.log(`   📦 Pieces placed: ${result.statistics.totalPieces}`);
            console.log(`   📄 Sheets used: ${result.stockUsedCount}`);
            console.log(`   📐 Total area: ${(result.statistics.totalStockArea / 1000000).toFixed(2)} m²`);
            console.log(`   📐 Used area: ${(result.statistics.totalUsedArea / 1000000).toFixed(2)} m²`);
            console.log(`   🗑️  Waste: ${result.totalWastePercentage.toFixed(2)}%`);
            console.log(`\n   📈 OLD Efficiency: ${scenario.oldEfficiency.toFixed(2)}%`);
            console.log(`   📈 NEW Efficiency: ${newEff.toFixed(2)}%`);
            console.log(`   ${improvement >= 0 ? '✅' : '❌'} Improvement: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(2)}%`);
            if (result.unplacedPieces.length > 0) {
                console.log(`   ⚠️  Unplaced: ${result.unplacedPieces.length}`);
            }
            results.push({
                name: scenario.name,
                old: scenario.oldEfficiency,
                new: newEff,
                improvement
            });
            totalOldEfficiency += scenario.oldEfficiency;
            totalNewEfficiency += newEff;
        }
        catch (error) {
            console.error(`   ❌ Error:`, error);
            results.push({ name: scenario.name, old: scenario.oldEfficiency, new: 0, improvement: -100 });
        }
    }
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log('\n   Results:');
    for (const r of results) {
        const sign = r.improvement >= 0 ? '+' : '';
        const emoji = r.improvement >= 5 ? '🚀' : (r.improvement >= 0 ? '✅' : '❌');
        console.log(`   ${emoji} ${r.name}: ${r.old.toFixed(1)}% → ${r.new.toFixed(1)}% (${sign}${r.improvement.toFixed(1)}%)`);
    }
    const avgOld = totalOldEfficiency / results.length;
    const avgNew = totalNewEfficiency / results.length;
    const avgImprovement = avgNew - avgOld;
    console.log('\n   📊 Averages:');
    console.log(`      Old: ${avgOld.toFixed(2)}%`);
    console.log(`      New: ${avgNew.toFixed(2)}%`);
    console.log(`      Improvement: ${avgImprovement >= 0 ? '+' : ''}${avgImprovement.toFixed(2)}%`);
}
// Run
runEnhancedTests();
//# sourceMappingURL=enhanced-2d.test.js.map