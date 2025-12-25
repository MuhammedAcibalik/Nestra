"use strict";
/**
 * Real-World Algorithm Tests
 * Comprehensive testing with synthetic data based on real industry scenarios
 *
 * Test Scenarios:
 * 1. Furniture Manufacturing - Cabinet parts
 * 2. Metal Cutting - Structural profiles
 * 3. Glass Cutting - Window panes
 * 4. Wood Panel Cutting - Furniture boards
 */
Object.defineProperty(exports, "__esModule", { value: true });
const cutting1d_1 = require("../cutting1d");
// ==================== TEST DATA GENERATORS ====================
/**
 * Generate realistic cabinet door sizes (mm)
 * Based on standard kitchen cabinet dimensions
 */
function generateCabinetDoorPieces() {
    return [
        // Base cabinet doors (600mm wide standard)
        { id: 'door-base-1', length: 600, quantity: 4, orderItemId: 'order-1' },
        { id: 'door-base-2', length: 450, quantity: 6, orderItemId: 'order-1' },
        { id: 'door-base-3', length: 300, quantity: 8, orderItemId: 'order-1' },
        // Wall cabinet doors
        { id: 'door-wall-1', length: 720, quantity: 4, orderItemId: 'order-2' },
        { id: 'door-wall-2', length: 600, quantity: 2, orderItemId: 'order-2' },
        // Drawer fronts
        { id: 'drawer-1', length: 140, quantity: 12, orderItemId: 'order-3' },
        { id: 'drawer-2', length: 200, quantity: 8, orderItemId: 'order-3' },
        // Shelves
        { id: 'shelf-1', length: 570, quantity: 20, orderItemId: 'order-4' },
        { id: 'shelf-2', length: 470, quantity: 15, orderItemId: 'order-4' },
        // Small parts
        { id: 'small-1', length: 150, quantity: 10, orderItemId: 'order-5' },
        { id: 'small-2', length: 100, quantity: 15, orderItemId: 'order-5' },
    ];
}
/**
 * Generate metal profile pieces (mm)
 * Steel sections for structural work
 */
function generateMetalProfilePieces() {
    return [
        // Main beams
        { id: 'beam-1', length: 6000, quantity: 10, orderItemId: 'struct-1' },
        { id: 'beam-2', length: 4500, quantity: 8, orderItemId: 'struct-1' },
        { id: 'beam-3', length: 3000, quantity: 12, orderItemId: 'struct-1' },
        // Columns
        { id: 'col-1', length: 3500, quantity: 8, orderItemId: 'struct-2' },
        { id: 'col-2', length: 2800, quantity: 6, orderItemId: 'struct-2' },
        // Braces
        { id: 'brace-1', length: 1200, quantity: 24, orderItemId: 'struct-3' },
        { id: 'brace-2', length: 900, quantity: 30, orderItemId: 'struct-3' },
        // Small connectors
        { id: 'conn-1', length: 300, quantity: 50, orderItemId: 'struct-4' },
        { id: 'conn-2', length: 200, quantity: 40, orderItemId: 'struct-4' },
    ];
}
/**
 * Generate wood molding pieces (mm)
 * Crown molding and trim
 */
function generateMoldingPieces() {
    return [
        // Room perimeters (various room sizes)
        { id: 'room-1', length: 4200, quantity: 4, orderItemId: 'room-1' }, // 4.2m walls
        { id: 'room-2', length: 3800, quantity: 4, orderItemId: 'room-2' }, // 3.8m walls
        { id: 'room-3', length: 5500, quantity: 2, orderItemId: 'room-3' }, // Large room
        { id: 'room-4', length: 2400, quantity: 6, orderItemId: 'room-4' }, // Small room
        // Door frames
        { id: 'frame-1', length: 2100, quantity: 12, orderItemId: 'frames' }, // Standard height
        { id: 'frame-2', length: 900, quantity: 24, orderItemId: 'frames' }, // Top pieces
        // Window sills
        { id: 'sill-1', length: 1200, quantity: 8, orderItemId: 'windows' },
        { id: 'sill-2', length: 800, quantity: 10, orderItemId: 'windows' },
    ];
}
/**
 * Generate standard stock bars
 */
function generateStandardStock() {
    return [
        // Standard 6m bars (most common)
        { id: 'stock-6m-1', length: 6000, available: 50, unitPrice: 100 },
        { id: 'stock-6m-2', length: 6000, available: 50, unitPrice: 100 },
        // 4m bars (cheaper per meter)
        { id: 'stock-4m-1', length: 4000, available: 30, unitPrice: 60 },
        { id: 'stock-4m-2', length: 4000, available: 30, unitPrice: 60 },
        // 3m bars (small jobs)
        { id: 'stock-3m-1', length: 3000, available: 20, unitPrice: 40 },
    ];
}
/**
 * Generate metal stock (12m standard length)
 */
function generateMetalStock() {
    return [
        { id: 'steel-12m-1', length: 12000, available: 20, unitPrice: 250 },
        { id: 'steel-12m-2', length: 12000, available: 20, unitPrice: 250 },
        { id: 'steel-6m-1', length: 6000, available: 15, unitPrice: 120 },
    ];
}
const testScenarios = [
    {
        name: 'Cabinet Manufacturing - FFD',
        description: 'Standard kitchen cabinet parts using First Fit Decreasing',
        pieces: generateCabinetDoorPieces(),
        stock: generateStandardStock(),
        options: { algorithm: 'FFD', kerf: 3, minUsableWaste: 100 },
        expectedMinEfficiency: 75
    },
    {
        name: 'Cabinet Manufacturing - BFD',
        description: 'Standard kitchen cabinet parts using Best Fit Decreasing',
        pieces: generateCabinetDoorPieces(),
        stock: generateStandardStock(),
        options: { algorithm: 'BFD', kerf: 3, minUsableWaste: 100 },
        expectedMinEfficiency: 78
    },
    {
        name: 'Metal Structural Work - FFD',
        description: 'Steel profiles for building structure',
        pieces: generateMetalProfilePieces(),
        stock: generateMetalStock(),
        options: { algorithm: 'FFD', kerf: 5, minUsableWaste: 200 },
        expectedMinEfficiency: 80
    },
    {
        name: 'Metal Structural Work - BFD',
        description: 'Steel profiles optimized with Best Fit',
        pieces: generateMetalProfilePieces(),
        stock: generateMetalStock(),
        options: { algorithm: 'BFD', kerf: 5, minUsableWaste: 200 },
        expectedMinEfficiency: 82
    },
    {
        name: 'Wood Molding Installation',
        description: 'Crown molding for multiple rooms',
        pieces: generateMoldingPieces(),
        stock: generateStandardStock(),
        options: { algorithm: 'BFD', kerf: 2, minUsableWaste: 150 },
        expectedMinEfficiency: 70
    },
    {
        name: 'High Variety Small Parts',
        description: 'Many different small pieces - stress test',
        pieces: [
            ...generateCabinetDoorPieces(),
            { id: 'extra-1', length: 250, quantity: 50, orderItemId: 'extra' },
            { id: 'extra-2', length: 180, quantity: 40, orderItemId: 'extra' },
            { id: 'extra-3', length: 120, quantity: 60, orderItemId: 'extra' },
        ],
        stock: generateStandardStock(),
        options: { algorithm: 'BFD', kerf: 3, minUsableWaste: 80 },
        expectedMinEfficiency: 85
    },
    {
        name: 'Large Pieces Only',
        description: 'Only large pieces - tests stock utilization',
        pieces: [
            { id: 'large-1', length: 5500, quantity: 5, orderItemId: 'large' },
            { id: 'large-2', length: 5000, quantity: 3, orderItemId: 'large' },
            { id: 'large-3', length: 4800, quantity: 4, orderItemId: 'large' },
        ],
        stock: generateStandardStock(),
        options: { algorithm: 'FFD', kerf: 3, minUsableWaste: 100 },
        expectedMinEfficiency: 75
    },
    {
        name: 'Tight Fit Challenge',
        description: 'Pieces designed to fit tightly in stock',
        pieces: [
            { id: 'tight-1', length: 2990, quantity: 10, orderItemId: 'tight' }, // 2x per 6m bar with 3mm kerf
            { id: 'tight-2', length: 1990, quantity: 15, orderItemId: 'tight' }, // 3x per 6m bar
            { id: 'tight-3', length: 990, quantity: 30, orderItemId: 'tight' }, // 6x per 6m bar
        ],
        stock: [{ id: 'stock-6m', length: 6000, available: 100, unitPrice: 100 }],
        options: { algorithm: 'BFD', kerf: 3, minUsableWaste: 50 },
        expectedMinEfficiency: 90
    }
];
// ==================== TEST RUNNER ====================
function printResult(scenario, result) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   📦 Pieces placed: ${result.statistics.totalPieces}`);
    console.log(`   🔪 Stock bars used: ${result.stockUsedCount}`);
    console.log(`   📏 Total stock length: ${result.statistics.totalStockLength}mm`);
    console.log(`   📏 Total used length: ${result.statistics.totalUsedLength}mm`);
    console.log(`   🗑️  Total waste: ${result.totalWaste}mm (${result.totalWastePercentage.toFixed(2)}%)`);
    console.log(`   ⚡ Efficiency: ${result.statistics.efficiency.toFixed(2)}%`);
    if (result.unplacedPieces.length > 0) {
        console.log(`   ⚠️  Unplaced pieces: ${result.unplacedPieces.length}`);
    }
    // Check against expected efficiency
    const passed = result.statistics.efficiency >= scenario.expectedMinEfficiency;
    console.log(`\n   ${passed ? '✅' : '❌'} Expected min efficiency: ${scenario.expectedMinEfficiency}%`);
    // Show bar utilization breakdown
    console.log(`\n📊 Bar Utilization:`);
    result.bars.slice(0, 5).forEach((bar, i) => {
        const usedLength = bar.cuts.reduce((sum, c) => sum + c.length, 0);
        const utilization = ((usedLength / bar.stockLength) * 100).toFixed(1);
        console.log(`   Bar ${i + 1}: ${bar.cuts.length} cuts, ${utilization}% utilized, ${bar.waste}mm waste`);
    });
    if (result.bars.length > 5) {
        console.log(`   ... and ${result.bars.length - 5} more bars`);
    }
}
function runAllTests() {
    console.log('\n' + '🚀'.repeat(30));
    console.log('   1D CUTTING OPTIMIZATION - REAL WORLD TESTS');
    console.log('🚀'.repeat(30));
    let passed = 0;
    let failed = 0;
    const results = [];
    for (const scenario of testScenarios) {
        try {
            const result = (0, cutting1d_1.optimize1D)(scenario.pieces, scenario.stock, scenario.options);
            printResult(scenario, result);
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
runAllTests();
//# sourceMappingURL=real-world-1d.test.js.map