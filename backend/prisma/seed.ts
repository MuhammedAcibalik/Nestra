/**
 * Database Seed Script
 * Creates initial data for the Nestra system
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create Roles
    console.log('Creating roles...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
            displayName: 'Sistem Yöneticisi',
            permissions: ['*']
        }
    });

    await prisma.role.upsert({
        where: { name: 'planner' },
        update: {},
        create: {
            name: 'planner',
            displayName: 'Planlamacı',
            permissions: ['orders:*', 'optimization:*', 'stock:read', 'reports:read']
        }
    });

    await prisma.role.upsert({
        where: { name: 'operator' },
        update: {},
        create: {
            name: 'operator',
            displayName: 'Üretim Operatörü',
            permissions: ['production:*', 'stock:read']
        }
    });

    await prisma.role.upsert({
        where: { name: 'manager' },
        update: {},
        create: {
            name: 'manager',
            displayName: 'Yönetici',
            permissions: ['reports:*', 'orders:read', 'production:read']
        }
    });

    // Create Admin User
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@nestra.com' },
        update: {},
        create: {
            email: 'admin@nestra.com',
            password: hashedPassword,
            firstName: 'Sistem',
            lastName: 'Yöneticisi',
            roleId: adminRole.id,
            isActive: true
        }
    });

    // Create Languages
    console.log('Creating languages...');
    await prisma.language.upsert({
        where: { code: 'tr' },
        update: {},
        create: { name: 'Türkçe', code: 'tr', isDefault: true }
    });

    await prisma.language.upsert({
        where: { code: 'en' },
        update: {},
        create: { name: 'English', code: 'en', isDefault: false }
    });

    // Create Currencies
    console.log('Creating currencies...');
    await prisma.currency.upsert({
        where: { code: 'TRY' },
        update: {},
        create: { name: 'Türk Lirası', code: 'TRY', symbol: '₺', isDefault: true }
    });

    await prisma.currency.upsert({
        where: { code: 'USD' },
        update: {},
        create: { name: 'US Dollar', code: 'USD', symbol: '$', isDefault: false }
    });

    await prisma.currency.upsert({
        where: { code: 'EUR' },
        update: {},
        create: { name: 'Euro', code: 'EUR', symbol: '€', isDefault: false }
    });

    // Create Measurement Units
    console.log('Creating measurement units...');
    const lengthUnits = [
        { name: 'Milimetre', symbol: 'mm', type: 'length', conversionToBase: 1, isDefault: true },
        { name: 'Santimetre', symbol: 'cm', type: 'length', conversionToBase: 10, isDefault: false },
        { name: 'Metre', symbol: 'm', type: 'length', conversionToBase: 1000, isDefault: false },
        { name: 'İnç', symbol: 'inch', type: 'length', conversionToBase: 25.4, isDefault: false },
    ];

    const areaUnits = [
        { name: 'Milimetrekare', symbol: 'mm²', type: 'area', conversionToBase: 1, isDefault: true },
        { name: 'Santimetrekare', symbol: 'cm²', type: 'area', conversionToBase: 100, isDefault: false },
        { name: 'Metrekare', symbol: 'm²', type: 'area', conversionToBase: 1000000, isDefault: false },
    ];

    for (const unit of [...lengthUnits, ...areaUnits]) {
        await prisma.measurementUnit.upsert({
            where: { symbol_type: { symbol: unit.symbol, type: unit.type } },
            update: {},
            create: unit
        });
    }

    // Create Material Types
    console.log('Creating material types...');
    const materials = [
        { name: 'SAC', description: 'Sac levha', isRotatable: true, defaultDensity: 7850 },
        { name: 'AHŞAP', description: 'Ahşap panel ve levha', isRotatable: false, defaultDensity: 600 },
        { name: 'GALVANİZ', description: 'Galvanizli sac', isRotatable: true, defaultDensity: 7850 },
        { name: 'ALÜMİNYUM', description: 'Alüminyum levha ve profil', isRotatable: true, defaultDensity: 2700 },
        { name: 'KARTON', description: 'Karton ve mukavva', isRotatable: true, defaultDensity: 250 },
        { name: 'PLASTİK', description: 'Plastik levha', isRotatable: true, defaultDensity: 1200 },
        { name: 'PROFİL', description: 'Metal profil', isRotatable: false, defaultDensity: 7850 },
    ];

    for (const material of materials) {
        const created = await prisma.materialType.upsert({
            where: { name: material.name },
            update: {},
            create: material
        });

        // Add thickness ranges for each material
        const thicknesses = [
            { name: '0.5-1.0mm', minThickness: 0.5, maxThickness: 1 },
            { name: '1.0-2.0mm', minThickness: 1, maxThickness: 2 },
            { name: '2.0-3.0mm', minThickness: 2, maxThickness: 3 },
            { name: '3.0-5.0mm', minThickness: 3, maxThickness: 5 },
            { name: '5.0-10.0mm', minThickness: 5, maxThickness: 10 },
        ];

        for (const thickness of thicknesses) {
            await prisma.thicknessRange.upsert({
                where: { materialTypeId_name: { materialTypeId: created.id, name: thickness.name } },
                update: {},
                create: { ...thickness, materialTypeId: created.id }
            });
        }
    }

    // Create Default Locations
    console.log('Creating locations...');
    await prisma.location.upsert({
        where: { name: 'Ana Depo' },
        update: {},
        create: { name: 'Ana Depo', description: 'Ana malzeme deposu' }
    });

    await prisma.location.upsert({
        where: { name: 'Üretim Alanı' },
        update: {},
        create: { name: 'Üretim Alanı', description: 'Üretim hattı' }
    });

    // Create Default Waste Policy
    console.log('Creating waste policies...');
    await prisma.wastePolicy.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            name: 'Varsayılan Fire Politikası',
            min1DUsableLength: 200,
            min2DUsableArea: 10000,
            min2DWidth: 100,
            min2DHeight: 100,
            isDefault: true
        }
    });

    // Create Sample Machines
    console.log('Creating machines...');
    await prisma.machine.upsert({
        where: { code: 'CNC-001' },
        update: {},
        create: {
            code: 'CNC-001',
            name: 'CNC Lazer Kesim',
            machineType: 'LASER',
            maxWidth: 3000,
            maxHeight: 1500,
            minCutLength: 5,
            kerf: 0.2,
            isActive: true
        }
    });

    await prisma.machine.upsert({
        where: { code: 'GIL-001' },
        update: {},
        create: {
            code: 'GIL-001',
            name: 'Giyotin Makas',
            machineType: 'GUILLOTINE',
            maxWidth: 2500,
            maxHeight: 1250,
            minCutLength: 50,
            kerf: 0,
            onlyGuillotine: true,
            isActive: true
        }
    });

    await prisma.machine.upsert({
        where: { code: 'SAW-001' },
        update: {},
        create: {
            code: 'SAW-001',
            name: 'Şerit Testere',
            machineType: 'SAW',
            maxLength: 6000,
            minCutLength: 50,
            kerf: 3,
            isActive: true
        }
    });

    console.log('✅ Database seeded successfully!');
}

const run = async () => {
    try {
        await main();
    } catch (e) {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

void run();
