/**
 * Validation Schemas
 * Using Zod for TypeScript-first schema validation
 * Following ISP - Each schema is focused on a specific entity
 */
import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const dateRangeSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    endDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roleId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const geometryTypeSchema: z.ZodEnum<{
    BAR_1D: "BAR_1D";
    RECTANGLE: "RECTANGLE";
    CIRCLE: "CIRCLE";
    SQUARE: "SQUARE";
    POLYGON: "POLYGON";
    FREEFORM: "FREEFORM";
}>;
export declare const orderItemSchema: z.ZodObject<{
    itemCode: z.ZodOptional<z.ZodString>;
    itemName: z.ZodOptional<z.ZodString>;
    geometryType: z.ZodEnum<{
        BAR_1D: "BAR_1D";
        RECTANGLE: "RECTANGLE";
        CIRCLE: "CIRCLE";
        SQUARE: "SQUARE";
        POLYGON: "POLYGON";
        FREEFORM: "FREEFORM";
    }>;
    length: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    diameter: z.ZodOptional<z.ZodNumber>;
    materialTypeId: z.ZodString;
    thickness: z.ZodNumber;
    quantity: z.ZodNumber;
    canRotate: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const createOrderSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemCode: z.ZodOptional<z.ZodString>;
        itemName: z.ZodOptional<z.ZodString>;
        geometryType: z.ZodEnum<{
            BAR_1D: "BAR_1D";
            RECTANGLE: "RECTANGLE";
            CIRCLE: "CIRCLE";
            SQUARE: "SQUARE";
            POLYGON: "POLYGON";
            FREEFORM: "FREEFORM";
        }>;
        length: z.ZodOptional<z.ZodNumber>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        diameter: z.ZodOptional<z.ZodNumber>;
        materialTypeId: z.ZodString;
        thickness: z.ZodNumber;
        quantity: z.ZodNumber;
        canRotate: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const updateOrderSchema: z.ZodObject<{
    customerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        DRAFT: "DRAFT";
        CONFIRMED: "CONFIRMED";
        IN_PLANNING: "IN_PLANNING";
        IN_PRODUCTION: "IN_PRODUCTION";
        COMPLETED: "COMPLETED";
        CANCELLED: "CANCELLED";
    }>>;
}, z.core.$strip>;
export declare const stockTypeSchema: z.ZodEnum<{
    BAR_1D: "BAR_1D";
    SHEET_2D: "SHEET_2D";
}>;
export declare const createStockSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    materialTypeId: z.ZodString;
    thicknessRangeId: z.ZodOptional<z.ZodString>;
    thickness: z.ZodNumber;
    stockType: z.ZodEnum<{
        BAR_1D: "BAR_1D";
        SHEET_2D: "SHEET_2D";
    }>;
    length: z.ZodOptional<z.ZodNumber>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    quantity: z.ZodDefault<z.ZodNumber>;
    unitPrice: z.ZodOptional<z.ZodNumber>;
    locationId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateStockSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    materialTypeId: z.ZodOptional<z.ZodString>;
    thicknessRangeId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    thickness: z.ZodOptional<z.ZodNumber>;
    stockType: z.ZodOptional<z.ZodEnum<{
        BAR_1D: "BAR_1D";
        SHEET_2D: "SHEET_2D";
    }>>;
    length: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    width: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    height: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    unitPrice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    locationId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const movementTypeSchema: z.ZodEnum<{
    PURCHASE: "PURCHASE";
    CONSUMPTION: "CONSUMPTION";
    WASTE_REUSE: "WASTE_REUSE";
    SCRAP: "SCRAP";
    ADJUSTMENT: "ADJUSTMENT";
    TRANSFER: "TRANSFER";
}>;
export declare const createMovementSchema: z.ZodObject<{
    stockItemId: z.ZodString;
    movementType: z.ZodEnum<{
        PURCHASE: "PURCHASE";
        CONSUMPTION: "CONSUMPTION";
        WASTE_REUSE: "WASTE_REUSE";
        SCRAP: "SCRAP";
        ADJUSTMENT: "ADJUSTMENT";
        TRANSFER: "TRANSFER";
    }>;
    quantity: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
    productionLogId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createCuttingJobSchema: z.ZodObject<{
    materialTypeId: z.ZodString;
    thickness: z.ZodNumber;
    orderItemIds: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const updateCuttingJobStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        IN_PRODUCTION: "IN_PRODUCTION";
        COMPLETED: "COMPLETED";
        PENDING: "PENDING";
        OPTIMIZING: "OPTIMIZING";
        OPTIMIZED: "OPTIMIZED";
    }>;
}, z.core.$strip>;
export declare const addJobItemSchema: z.ZodObject<{
    orderItemId: z.ZodString;
    quantity: z.ZodNumber;
}, z.core.$strip>;
export declare const optimizationObjectivesSchema: z.ZodObject<{
    minimizeWaste: z.ZodOptional<z.ZodNumber>;
    minimizeStockVariety: z.ZodOptional<z.ZodNumber>;
    minimizeSetupChanges: z.ZodOptional<z.ZodNumber>;
    minimizeProductionTime: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const optimizationConstraintsSchema: z.ZodObject<{
    algorithm: z.ZodOptional<z.ZodEnum<{
        FFD: "FFD";
        BFD: "BFD";
        BRANCH_BOUND: "BRANCH_BOUND";
        BOTTOM_LEFT: "BOTTOM_LEFT";
        GUILLOTINE: "GUILLOTINE";
    }>>;
    kerf: z.ZodOptional<z.ZodNumber>;
    minUsableWaste: z.ZodOptional<z.ZodNumber>;
    allowRotation: z.ZodOptional<z.ZodBoolean>;
    guillotineOnly: z.ZodOptional<z.ZodBoolean>;
    allowedMachines: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const createScenarioSchema: z.ZodObject<{
    name: z.ZodString;
    cuttingJobId: z.ZodString;
    parameters: z.ZodOptional<z.ZodObject<{
        objectives: z.ZodOptional<z.ZodObject<{
            minimizeWaste: z.ZodOptional<z.ZodNumber>;
            minimizeStockVariety: z.ZodOptional<z.ZodNumber>;
            minimizeSetupChanges: z.ZodOptional<z.ZodNumber>;
            minimizeProductionTime: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        constraints: z.ZodOptional<z.ZodObject<{
            algorithm: z.ZodOptional<z.ZodEnum<{
                FFD: "FFD";
                BFD: "BFD";
                BRANCH_BOUND: "BRANCH_BOUND";
                BOTTOM_LEFT: "BOTTOM_LEFT";
                GUILLOTINE: "GUILLOTINE";
            }>>;
            kerf: z.ZodOptional<z.ZodNumber>;
            minUsableWaste: z.ZodOptional<z.ZodNumber>;
            allowRotation: z.ZodOptional<z.ZodBoolean>;
            guillotineOnly: z.ZodOptional<z.ZodBoolean>;
            allowedMachines: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    useWarehouseStock: z.ZodDefault<z.ZodBoolean>;
    useStandardSizes: z.ZodDefault<z.ZodBoolean>;
    selectedStockIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const approvePlanSchema: z.ZodObject<{
    machineId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const startProductionSchema: z.ZodObject<{
    planId: z.ZodString;
}, z.core.$strip>;
export declare const updateProductionSchema: z.ZodObject<{
    notes: z.ZodOptional<z.ZodString>;
    issues: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        severity: z.ZodEnum<{
            LOW: "LOW";
            MEDIUM: "MEDIUM";
            HIGH: "HIGH";
            CRITICAL: "CRITICAL";
        }>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const completeProductionSchema: z.ZodObject<{
    actualWaste: z.ZodNumber;
    actualTime: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
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
//# sourceMappingURL=schemas.d.ts.map