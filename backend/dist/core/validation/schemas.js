"use strict";
/**
 * Validation Schemas
 * Using Zod for TypeScript-first schema validation
 * Following ISP - Each schema is focused on a specific entity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeProductionSchema = exports.updateProductionSchema = exports.startProductionSchema = exports.approvePlanSchema = exports.createScenarioSchema = exports.optimizationConstraintsSchema = exports.optimizationObjectivesSchema = exports.addJobItemSchema = exports.updateCuttingJobStatusSchema = exports.createCuttingJobSchema = exports.createMovementSchema = exports.movementTypeSchema = exports.updateStockSchema = exports.createStockSchema = exports.stockTypeSchema = exports.updateOrderSchema = exports.createOrderSchema = exports.orderItemSchema = exports.geometryTypeSchema = exports.registerSchema = exports.loginSchema = exports.dateRangeSchema = exports.paginationSchema = exports.uuidSchema = void 0;
const zod_1 = require("zod");
// ==================== COMMON SCHEMAS ====================
exports.uuidSchema = zod_1.z.string().uuid('Geçersiz UUID formatı');
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20)
});
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional()
}).refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, { message: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır' });
// ==================== AUTH SCHEMAS ====================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçersiz email formatı'),
    password: zod_1.z.string().min(6, 'Şifre en az 6 karakter olmalıdır')
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Geçersiz email formatı'),
    password: zod_1.z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    firstName: zod_1.z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    lastName: zod_1.z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
    roleId: exports.uuidSchema.optional()
});
// ==================== ORDER SCHEMAS ====================
exports.geometryTypeSchema = zod_1.z.enum([
    'BAR_1D', 'RECTANGLE', 'CIRCLE', 'SQUARE', 'POLYGON', 'FREEFORM'
]);
exports.orderItemSchema = zod_1.z.object({
    itemCode: zod_1.z.string().optional(),
    itemName: zod_1.z.string().optional(),
    geometryType: exports.geometryTypeSchema,
    length: zod_1.z.number().positive().optional(),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    diameter: zod_1.z.number().positive().optional(),
    materialTypeId: exports.uuidSchema,
    thickness: zod_1.z.number().positive('Kalınlık pozitif olmalıdır'),
    quantity: zod_1.z.number().int().positive('Miktar pozitif tam sayı olmalıdır'),
    canRotate: zod_1.z.boolean().default(true)
}).refine((data) => {
    // 1D items require length
    if (data.geometryType === 'BAR_1D' && !data.length) {
        return false;
    }
    // 2D rectangular items require width and height
    if (['RECTANGLE', 'SQUARE'].includes(data.geometryType) && (!data.width || !data.height)) {
        return false;
    }
    // Circle requires diameter
    if (data.geometryType === 'CIRCLE' && !data.diameter) {
        return false;
    }
    return true;
}, { message: 'Geometri tipine uygun boyutlar belirtilmelidir' });
exports.createOrderSchema = zod_1.z.object({
    customerId: exports.uuidSchema.optional(),
    priority: zod_1.z.number().int().min(1).max(10).default(5),
    dueDate: zod_1.z.coerce.date().optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(exports.orderItemSchema).optional()
});
exports.updateOrderSchema = zod_1.z.object({
    customerId: exports.uuidSchema.optional().nullable(),
    priority: zod_1.z.number().int().min(1).max(10).optional(),
    dueDate: zod_1.z.coerce.date().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED', 'IN_PLANNING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED']).optional()
});
// ==================== STOCK SCHEMAS ====================
exports.stockTypeSchema = zod_1.z.enum(['BAR_1D', 'SHEET_2D']);
exports.createStockSchema = zod_1.z.object({
    code: zod_1.z.string().min(1, 'Stok kodu gereklidir'),
    name: zod_1.z.string().min(1, 'Stok adı gereklidir'),
    materialTypeId: exports.uuidSchema,
    thicknessRangeId: exports.uuidSchema.optional(),
    thickness: zod_1.z.number().positive('Kalınlık pozitif olmalıdır'),
    stockType: exports.stockTypeSchema,
    length: zod_1.z.number().positive().optional(),
    width: zod_1.z.number().positive().optional(),
    height: zod_1.z.number().positive().optional(),
    quantity: zod_1.z.number().int().nonnegative('Miktar negatif olamaz').default(0),
    unitPrice: zod_1.z.number().nonnegative().optional(),
    locationId: exports.uuidSchema.optional()
}).refine((data) => {
    if (data.stockType === 'BAR_1D' && !data.length) {
        return false;
    }
    if (data.stockType === 'SHEET_2D' && (!data.width || !data.height)) {
        return false;
    }
    return true;
}, { message: 'Stok tipine uygun boyutlar belirtilmelidir' });
exports.updateStockSchema = exports.createStockSchema.partial();
exports.movementTypeSchema = zod_1.z.enum([
    'PURCHASE', 'CONSUMPTION', 'WASTE_REUSE', 'SCRAP', 'ADJUSTMENT', 'TRANSFER'
]);
exports.createMovementSchema = zod_1.z.object({
    stockItemId: exports.uuidSchema,
    movementType: exports.movementTypeSchema,
    quantity: zod_1.z.number().int().positive('Miktar pozitif tam sayı olmalıdır'),
    notes: zod_1.z.string().optional(),
    productionLogId: exports.uuidSchema.optional()
});
// ==================== CUTTING JOB SCHEMAS ====================
exports.createCuttingJobSchema = zod_1.z.object({
    materialTypeId: exports.uuidSchema,
    thickness: zod_1.z.number().positive('Kalınlık pozitif olmalıdır'),
    orderItemIds: zod_1.z.array(exports.uuidSchema).default([])
});
exports.updateCuttingJobStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'OPTIMIZING', 'OPTIMIZED', 'IN_PRODUCTION', 'COMPLETED'])
});
exports.addJobItemSchema = zod_1.z.object({
    orderItemId: exports.uuidSchema,
    quantity: zod_1.z.number().int().positive('Miktar pozitif tam sayı olmalıdır')
});
// ==================== OPTIMIZATION SCHEMAS ====================
exports.optimizationObjectivesSchema = zod_1.z.object({
    minimizeWaste: zod_1.z.number().min(0).max(1).optional(),
    minimizeStockVariety: zod_1.z.number().min(0).max(1).optional(),
    minimizeSetupChanges: zod_1.z.number().min(0).max(1).optional(),
    minimizeProductionTime: zod_1.z.number().min(0).max(1).optional()
});
exports.optimizationConstraintsSchema = zod_1.z.object({
    algorithm: zod_1.z.enum(['FFD', 'BFD', 'BRANCH_BOUND', 'BOTTOM_LEFT', 'GUILLOTINE']).optional(),
    kerf: zod_1.z.number().nonnegative().optional(),
    minUsableWaste: zod_1.z.number().nonnegative().optional(),
    allowRotation: zod_1.z.boolean().optional(),
    guillotineOnly: zod_1.z.boolean().optional(),
    allowedMachines: zod_1.z.array(exports.uuidSchema).optional()
});
exports.createScenarioSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Senaryo adı gereklidir'),
    cuttingJobId: exports.uuidSchema,
    parameters: zod_1.z.object({
        objectives: exports.optimizationObjectivesSchema.optional(),
        constraints: exports.optimizationConstraintsSchema.optional()
    }).optional(),
    useWarehouseStock: zod_1.z.boolean().default(true),
    useStandardSizes: zod_1.z.boolean().default(false),
    selectedStockIds: zod_1.z.array(exports.uuidSchema).optional()
});
exports.approvePlanSchema = zod_1.z.object({
    machineId: exports.uuidSchema.optional()
});
// ==================== PRODUCTION SCHEMAS ====================
exports.startProductionSchema = zod_1.z.object({
    planId: exports.uuidSchema
});
exports.updateProductionSchema = zod_1.z.object({
    notes: zod_1.z.string().optional(),
    issues: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string(),
        severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    })).optional()
});
exports.completeProductionSchema = zod_1.z.object({
    actualWaste: zod_1.z.number().nonnegative('Gerçek fire negatif olamaz'),
    actualTime: zod_1.z.number().nonnegative('Gerçek süre negatif olamaz'),
    notes: zod_1.z.string().optional()
});
//# sourceMappingURL=schemas.js.map