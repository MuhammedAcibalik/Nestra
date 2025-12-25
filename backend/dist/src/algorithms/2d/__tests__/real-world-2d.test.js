"use strict";
/**
 * Real-World 2D Algorithm Tests
 * Comprehensive testing with synthetic data based on real industry scenarios
 *
 * Test Scenarios:
 * 1. Furniture Panel Cutting - Kitchen cabinets
 * 2. Glass Cutting - Windows and doors
 * 3. Metal Sheet Cutting - Industrial parts
 * 4. Wood Panel Cutting - Flooring
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cutting2d_1 = require("../cutting2d");
// ==================== TEST DATA GENERATORS ====================
/**
 * Generate kitchen cabinet panel pieces (mm)
 * Standard 18mm MDF/Plywood panels
 */
function generateCabinetPanels() {
    return [
        // Side panels (tall)
        { id: 'side-1', width: 580, height: 720, quantity: 8, orderItemId: 'cabinet-1', canRotate: true },
        { id: 'side-2', width: 580, height: 850, quantity: 4, orderItemId: 'cabinet-1', canRotate: true },
        // Top/Bottom panels
        { id: 'top-1', width: 580, height: 560, quantity: 8, orderItemId: 'cabinet-2', canRotate: true },
        { id: 'bottom-1', width: 580, height: 560, quantity: 8, orderItemId: 'cabinet-2', canRotate: true },
        // Back panels
        { id: 'back-1', width: 560, height: 700, quantity: 8, orderItemId: 'cabinet-3', canRotate: true },
        // Shelves
        { id: 'shelf-1', width: 560, height: 350, quantity: 16, orderItemId: 'cabinet-4', canRotate: true },
        { id: 'shelf-2', width: 460, height: 300, quantity: 12, orderItemId: 'cabinet-4', canRotate: true },
        // Drawer bottoms
        { id: 'drawer-1', width: 450, height: 400, quantity: 12, orderItemId: 'cabinet-5', canRotate: true },
        { id: 'drawer-2', width: 350, height: 400, quantity: 8, orderItemId: 'cabinet-5', canRotate: true },
        // Small parts
        { id: 'small-1', width: 200, height: 150, quantity: 20, orderItemId: 'cabinet-6', canRotate: true },
    ];
}
/**
 * Generate window glass pieces (mm)
 * Various window sizes for a house
 */
function generateWindowGlass() {
    return [
        // Large living room windows
        { id: 'window-lr-1', width: 1200, height: 1400, quantity: 3, orderItemId: 'living', canRotate: false },
        { id: 'window-lr-2', width: 800, height: 1400, quantity: 2, orderItemId: 'living', canRotate: false },
        // Bedroom windows
        { id: 'window-br-1', width: 900, height: 1200, quantity: 4, orderItemId: 'bedroom', canRotate: false },
        { id: 'window-br-2', width: 600, height: 1200, quantity: 2, orderItemId: 'bedroom', canRotate: false },
        // Kitchen windows
        { id: 'window-kt-1', width: 1000, height: 800, quantity: 2, orderItemId: 'kitchen', canRotate: false },
        // Bathroom windows (frosted)
        { id: 'window-bt-1', width: 500, height: 600, quantity: 3, orderItemId: 'bathroom', canRotate: false },
        // Door glass panels
        { id: 'door-1', width: 400, height: 1800, quantity: 2, orderItemId: 'doors', canRotate: false },
        { id: 'door-2', width: 300, height: 500, quantity: 4, orderItemId: 'doors', canRotate: false },
    ];
}
/**
 * Generate metal sheet parts (mm)
 * Industrial machine parts
 */
function generateMetalParts() {
    return [
        // Large base plates
        { id: 'base-1', width: 800, height: 600, quantity: 4, orderItemId: 'machine-1', canRotate: true },
        { id: 'base-2', width: 500, height: 400, quantity: 6, orderItemId: 'machine-1', canRotate: true },
        // Side panels
        { id: 'panel-1', width: 600, height: 800, quantity: 8, orderItemId: 'machine-2', canRotate: true },
        { id: 'panel-2', width: 400, height: 600, quantity: 10, orderItemId: 'machine-2', canRotate: true },
        // Brackets and supports
        { id: 'bracket-1', width: 200, height: 300, quantity: 24, orderItemId: 'machine-3', canRotate: true },
        { id: 'bracket-2', width: 150, height: 200, quantity: 32, orderItemId: 'machine-3', canRotate: true },
        // Small parts
        { id: 'small-1', width: 100, height: 150, quantity: 50, orderItemId: 'machine-4', canRotate: true },
        { id: 'small-2', width: 80, height: 120, quantity: 40, orderItemId: 'machine-4', canRotate: true },
    ];
}
/**
 * Generate pieces with grain direction (wood veneer)
 */
function generateGrainDirectionPieces() {
    return [
        // Table tops - horizontal grain
        { id: 'table-1', width: 1200, height: 800, quantity: 4, orderItemId: 'tables', canRotate: false, grainDirection: 'HORIZONTAL' },
        { id: 'table-2', width: 900, height: 600, quantity: 6, orderItemId: 'tables', canRotate: false, grainDirection: 'HORIZONTAL' },
        // Door panels - vertical grain
        { id: 'door-1', width: 400, height: 1800, quantity: 8, orderItemId: 'doors', canRotate: false, grainDirection: 'VERTICAL' },
        { id: 'door-2', width: 350, height: 700, quantity: 12, orderItemId: 'doors', canRotate: false, grainDirection: 'VERTICAL' },
        // Drawer fronts - horizontal grain
        { id: 'drawer-1', width: 500, height: 200, quantity: 16, orderItemId: 'drawers', canRotate: false, grainDirection: 'HORIZONTAL' },
        // No grain restriction
        { id: 'back-1', width: 600, height: 400, quantity: 10, orderItemId: 'backs', canRotate: true, grainDirection: 'NONE' },
    ];
}
/**
 * Generate standard plywood sheets (mm)
 */
function generatePlywoodStock() {
    return [
        // Standard 2440x1220mm (8x4 feet) sheets
        { id: 'ply-1', width: 2440, height: 1220, available: 20, unitPrice: 50 },
        { id: 'ply-2', width: 2440, height: 1220, available: 20, unitPrice: 50 },
        // Half sheets
        { id: 'ply-half-1', width: 1220, height: 1220, available: 10, unitPrice: 25 },
    ];
}
/**
 * Generate glass stock sheets (mm)
 */
function generateGlassStock() {
    return [
        // Large glass sheets (6mm tempered)
        { id: 'glass-1', width: 3210, height: 2250, available: 10, unitPrice: 200 },
        { id: 'glass-2', width: 3210, height: 2250, available: 10, unitPrice: 200 },
        // Medium sheets
        { id: 'glass-med-1', width: 2000, height: 1500, available: 5, unitPrice: 100 },
    ];
}
/**
 * Generate metal stock sheets (mm)
 */
function generateMetalStock() {
    return [
        // Standard 2500x1250mm steel sheets
        { id: 'steel-1', width: 2500, height: 1250, available: 15, unitPrice: 150 },
        { id: 'steel-2', width: 2500, height: 1250, available: 15, unitPrice: 150 },
        // Large sheets
        { id: 'steel-lg-1', width: 3000, height: 1500, available: 8, unitPrice: 250 },
    ];
}
const testScenarios = [
    {
        name: 'Kitchen Cabinets - Bottom-Left',
        description: 'MDF panels for complete kitchen using Bottom-Left algorithm',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'BOTTOM_LEFT', kerf: 3, allowRotation: true, guillotineOnly: false },
        expectedMinEfficiency: 70
    },
    {
        name: 'Kitchen Cabinets - Guillotine',
        description: 'Same cabinets with Guillotine cutting (CNC compatible)',
        pieces: generateCabinetPanels(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'GUILLOTINE', kerf: 3, allowRotation: true, guillotineOnly: true },
        expectedMinEfficiency: 65
    },
    {
        name: 'Window Glass Cutting',
        description: 'Glass panels for house windows (no rotation allowed)',
        pieces: generateWindowGlass(),
        stock: generateGlassStock(),
        options: { algorithm: 'GUILLOTINE', kerf: 5, allowRotation: false, guillotineOnly: true },
        expectedMinEfficiency: 60
    },
    {
        name: 'Metal Industrial Parts',
        description: 'Steel parts for machinery with rotation',
        pieces: generateMetalParts(),
        stock: generateMetalStock(),
        options: { algorithm: 'BOTTOM_LEFT', kerf: 2, allowRotation: true, guillotineOnly: false },
        expectedMinEfficiency: 75
    },
    {
        name: 'Wood Veneer - Grain Direction',
        description: 'Veneer panels respecting grain direction',
        pieces: generateGrainDirectionPieces(),
        stock: generatePlywoodStock(),
        options: { algorithm: 'GUILLOTINE', kerf: 3, allowRotation: true, guillotineOnly: true, respectGrainDirection: true },
        expectedMinEfficiency: 55
    },
    {
        name: 'High Volume Small Parts',
        description: 'Many small parts - stress test for packing',
        pieces: [
            { id: 'small-a', width: 200, height: 150, quantity: 100, orderItemId: 'batch', canRotate: true },
            { id: 'small-b', width: 180, height: 120, quantity: 80, orderItemId: 'batch', canRotate: true },
            { id: 'small-c', width: 150, height: 100, quantity: 120, orderItemId: 'batch', canRotate: true },
        ],
        stock: generatePlywoodStock(),
        options: { algorithm: 'BOTTOM_LEFT', kerf: 3, allowRotation: true, guillotineOnly: false },
        expectedMinEfficiency: 80
    },
    {
        name: 'Large Pieces Challenge',
        description: 'Large pieces that barely fit in stock',
        pieces: [
            { id: 'large-1', width: 2400, height: 1200, quantity: 5, orderItemId: 'large', canRotate: true },
            { id: 'large-2', width: 2000, height: 1000, quantity: 4, orderItemId: 'large', canRotate: true },
            { id: 'large-3', width: 1800, height: 900, quantity: 6, orderItemId: 'large', canRotate: true },
        ],
        stock: generatePlywoodStock(),
        options: { algorithm: 'GUILLOTINE', kerf: 3, allowRotation: true, guillotineOnly: true },
        expectedMinEfficiency: 70
    },
    {
        name: 'Mixed Sizes Optimization',
        description: 'Combination of large and small pieces',
        pieces: [
            ...generateCabinetPanels().slice(0, 5),
            ...generateMetalParts().slice(5, 8),
        ],
        stock: generatePlywoodStock(),
        options: { algorithm: 'BOTTOM_LEFT', kerf: 3, allowRotation: true, guillotineOnly: false },
        expectedMinEfficiency: 70
    }
];
// ==================== TEST RUNNER ====================
function printResult2D(scenario, result) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   📦 Pieces placed: ${result.statistics.totalPieces}`);
    console.log(`   📄 Sheets used: ${result.stockUsedCount}`);
    console.log(`   📐 Total stock area: ${(result.statistics.totalStockArea / 1000000).toFixed(2)} m²`);
    console.log(`   📐 Total used area: ${(result.statistics.totalUsedArea / 1000000).toFixed(2)} m²`);
    console.log(`   🗑️  Total waste area: ${(result.totalWasteArea / 1000000).toFixed(2)} m² (${result.totalWastePercentage.toFixed(2)}%)`);
    console.log(`   ⚡ Efficiency: ${result.statistics.efficiency.toFixed(2)}%`);
    if (result.unplacedPieces.length > 0) {
        console.log(`   ⚠️  Unplaced pieces: ${result.unplacedPieces.length}`);
    }
    // Check against expected efficiency
    const passed = result.statistics.efficiency >= scenario.expectedMinEfficiency;
    console.log(`\n   ${passed ? '✅' : '❌'} Expected min efficiency: ${scenario.expectedMinEfficiency}%`);
    // Show sheet utilization breakdown
    console.log(`\n📊 Sheet Utilization:`);
    result.sheets.slice(0, 5).forEach((sheet, i) => {
        const utilization = ((sheet.usedArea / (sheet.stockWidth * sheet.stockHeight)) * 100).toFixed(1);
        console.log(`   Sheet ${i + 1}: ${sheet.placements.length} pieces, ${utilization}% utilized`);
    });
    if (result.sheets.length > 5) {
        console.log(`   ... and ${result.sheets.length - 5} more sheets`);
    }
}
function runAll2DTests() {
    console.log('\n' + '🚀'.repeat(30));
    console.log('   2D CUTTING OPTIMIZATION - REAL WORLD TESTS');
    console.log('🚀'.repeat(30));
    let passed = 0;
    let failed = 0;
    const results = [];
    for (const scenario of testScenarios) {
        try {
            const result = (0, cutting2d_1.optimize2D)(scenario.pieces, scenario.stock, scenario.options);
            printResult2D(scenario, result);
            const isPassed = result.statistics.efficiency >= scenario.expectedMinEfficiency;
            results.push({
                scenario: scenario.name,
                efficiency: result.statistics.efficiency,
                passed: isPassed
            });
            if (isPassed)
                passed++;
            else
                failed++;
        }
        catch (error) {
            console.error(`\n❌ Error in scenario "${scenario.name}":`, error);
            failed++;
            results.push({
                scenario: scenario.name,
                efficiency: 0,
                passed: false
            });
        }
    }
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n   ✅ Passed: ${passed}/${testScenarios.length}`);
    console.log(`   ❌ Failed: ${failed}/${testScenarios.length}`);
    console.log('\n   Results:');
    results.forEach(r => {
        console.log(`   ${r.passed ? '✅' : '❌'} ${r.scenario}: ${r.efficiency.toFixed(2)}%`);
    });
    // Calculate average efficiency
    const avgEfficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
    console.log(`\n   📊 Average Efficiency: ${avgEfficiency.toFixed(2)}%`);
}
// Run tests
runAll2DTests();
//# sourceMappingURL=real-world-2d.test.js.map