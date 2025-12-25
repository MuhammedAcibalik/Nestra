/**
 * Validation Schemas
 * Using Zod for TypeScript-first schema validation
 * Following ISP - Each schema is focused on a specific entity
 */

import { z } from 'zod';

// ==================== COMMON SCHEMAS ====================

export const uuidSchema = z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { message: 'Geçersiz UUID formatı' });

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
});

export const dateRangeSchema = z
    .object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional()
    })
    .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
        message: 'Başlangıç tarihi bitiş tarihinden önce olmalıdır'
    });

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: 'Geçersiz email formatı' }),
    password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' })
});

export const registerSchema = z.object({
    email: z.string().regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { message: 'Geçersiz email formatı' }),
    password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır' }),
    firstName: z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır' }),
    lastName: z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır' }),
    roleId: uuidSchema.optional()
});

// ==================== ORDER SCHEMAS ====================

export const geometryTypeSchema = z.enum(['BAR_1D', 'RECTANGLE', 'CIRCLE', 'SQUARE', 'POLYGON', 'FREEFORM']);

export const orderItemSchema = z
    .object({
        itemCode: z.string().optional(),
        itemName: z.string().optional(),
        geometryType: geometryTypeSchema,
        length: z.number().positive().optional(),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
        diameter: z.number().positive().optional(),
        materialTypeId: uuidSchema,
        thickness: z.number().positive({ message: 'Kalınlık pozitif olmalıdır' }),
        quantity: z.number().int().positive({ message: 'Miktar pozitif tam sayı olmalıdır' }),
        canRotate: z.boolean().default(true)
    })
    .refine(
        (data) => {
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
        },
        { message: 'Geometri tipine uygun boyutlar belirtilmelidir' }
    );

export const createOrderSchema = z.object({
    customerId: uuidSchema.optional(),
    priority: z.number().int().min(1).max(10).default(5),
    dueDate: z.coerce.date().optional(),
    notes: z.string().optional(),
    items: z.array(orderItemSchema).optional()
});

export const updateOrderSchema = z.object({
    customerId: uuidSchema.optional().nullable(),
    priority: z.number().int().min(1).max(10).optional(),
    dueDate: z.coerce.date().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PLANNING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED']).optional()
});

// ==================== STOCK SCHEMAS ====================

export const stockTypeSchema = z.enum(['BAR_1D', 'SHEET_2D']);

export const createStockSchema = z
    .object({
        code: z.string().min(1, { message: 'Stok kodu gereklidir' }),
        name: z.string().min(1, { message: 'Stok adı gereklidir' }),
        materialTypeId: uuidSchema,
        thicknessRangeId: uuidSchema.optional(),
        thickness: z.number().positive({ message: 'Kalınlık pozitif olmalıdır' }),
        stockType: stockTypeSchema,
        length: z.number().positive().optional(),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
        quantity: z.number().int().nonnegative({ message: 'Miktar negatif olamaz' }).default(0),
        unitPrice: z.number().nonnegative().optional(),
        locationId: uuidSchema.optional()
    })
    .refine(
        (data) => {
            if (data.stockType === 'BAR_1D' && !data.length) {
                return false;
            }
            if (data.stockType === 'SHEET_2D' && (!data.width || !data.height)) {
                return false;
            }
            return true;
        },
        { message: 'Stok tipine uygun boyutlar belirtilmelidir' }
    );

export const updateStockSchema = createStockSchema.partial();

export const movementTypeSchema = z.enum(['PURCHASE', 'CONSUMPTION', 'WASTE_REUSE', 'SCRAP', 'ADJUSTMENT', 'TRANSFER']);

export const createMovementSchema = z.object({
    stockItemId: uuidSchema,
    movementType: movementTypeSchema,
    quantity: z.number().int().positive({ message: 'Miktar pozitif tam sayı olmalıdır' }),
    notes: z.string().optional(),
    productionLogId: uuidSchema.optional()
});

// ==================== CUTTING JOB SCHEMAS ====================

export const createCuttingJobSchema = z.object({
    materialTypeId: uuidSchema,
    thickness: z.number().positive({ message: 'Kalınlık pozitif olmalıdır' }),
    orderItemIds: z.array(uuidSchema).default([])
});

export const updateCuttingJobStatusSchema = z.object({
    status: z.enum(['PENDING', 'OPTIMIZING', 'OPTIMIZED', 'IN_PRODUCTION', 'COMPLETED'])
});

export const addJobItemSchema = z.object({
    orderItemId: uuidSchema,
    quantity: z.number().int().positive({ message: 'Miktar pozitif tam sayı olmalıdır' })
});

// ==================== OPTIMIZATION SCHEMAS ====================

export const optimizationObjectivesSchema = z.object({
    minimizeWaste: z.number().min(0).max(1).optional(),
    minimizeStockVariety: z.number().min(0).max(1).optional(),
    minimizeSetupChanges: z.number().min(0).max(1).optional(),
    minimizeProductionTime: z.number().min(0).max(1).optional()
});

export const optimizationConstraintsSchema = z.object({
    algorithm: z.enum(['FFD', 'BFD', 'BRANCH_BOUND', 'BOTTOM_LEFT', 'GUILLOTINE']).optional(),
    kerf: z.number().nonnegative().optional(),
    minUsableWaste: z.number().nonnegative().optional(),
    allowRotation: z.boolean().optional(),
    guillotineOnly: z.boolean().optional(),
    allowedMachines: z.array(uuidSchema).optional()
});

export const createScenarioSchema = z.object({
    name: z.string().min(1, { message: 'Senaryo adı gereklidir' }),
    cuttingJobId: uuidSchema,
    parameters: z
        .object({
            objectives: optimizationObjectivesSchema.optional(),
            constraints: optimizationConstraintsSchema.optional()
        })
        .optional(),
    useWarehouseStock: z.boolean().default(true),
    useStandardSizes: z.boolean().default(false),
    selectedStockIds: z.array(uuidSchema).optional()
});

export const approvePlanSchema = z.object({
    machineId: uuidSchema.optional()
});

// ==================== PRODUCTION SCHEMAS ====================

export const startProductionSchema = z.object({
    planId: uuidSchema
});

export const updateProductionSchema = z.object({
    notes: z.string().optional(),
    issues: z
        .array(
            z.object({
                description: z.string(),
                severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
            })
        )
        .optional()
});

export const completeProductionSchema = z.object({
    actualWaste: z.number().nonnegative({ message: 'Gerçek fire negatif olamaz' }),
    actualTime: z.number().nonnegative({ message: 'Gerçek süre negatif olamaz' }),
    notes: z.string().optional()
});

// ==================== EXPORT TYPES ====================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CreateStockInput = z.infer<typeof createStockSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type CreateCuttingJobInput = z.infer<typeof createCuttingJobSchema>;
export type CreateScenarioInput = z.infer<typeof createScenarioSchema>;
export type StartProductionInput = z.infer<typeof startProductionSchema>;
export type UpdateProductionInput = z.infer<typeof updateProductionSchema>;
export type CompleteProductionInput = z.infer<typeof completeProductionSchema>;
