/**
 * Test Factories
 * Typed mock object builders for unit tests
 * Eliminates need for `as any` casts in test files
 */
import { GeometryType, OrderStatus, CuttingJobStatus, StockType, MovementType, PlanStatus } from '../../db/schema/enums';
export interface OrderFactoryInput {
    id?: string;
    tenantId?: string | null;
    orderNumber?: string;
    customerId?: string | null;
    createdById?: string;
    status?: OrderStatus;
    priority?: number;
    dueDate?: Date | null;
    notes?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare function createMockOrder(input?: OrderFactoryInput): {
    id: string;
    tenantId: string | null;
    orderNumber: string;
    customerId: string | null;
    createdById: string;
    status: "DRAFT" | "CONFIRMED" | "IN_PLANNING" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED";
    priority: number;
    dueDate: Date | null;
    notes: string | null;
    customFields: null;
    createdAt: Date;
    updatedAt: Date;
};
export interface OrderItemFactoryInput {
    id?: string;
    orderId?: string;
    itemCode?: string | null;
    itemName?: string | null;
    geometryType?: GeometryType;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    diameter?: number | null;
    materialTypeId?: string;
    thickness?: number;
    quantity?: number;
    producedQty?: number;
    canRotate?: boolean;
}
export declare function createMockOrderItem(input?: OrderItemFactoryInput): {
    id: string;
    orderId: string;
    itemCode: string;
    itemName: string;
    geometryType: "BAR_1D" | "RECTANGLE" | "CIRCLE" | "SQUARE" | "POLYGON" | "FREEFORM";
    length: number;
    width: number;
    height: number | null;
    diameter: number | null;
    polygonData: null;
    materialTypeId: string;
    thickness: number;
    quantity: number;
    producedQty: number;
    canRotate: boolean;
    grainDirection: null;
    customFields: null;
    createdAt: Date;
    updatedAt: Date;
};
export interface CuttingJobFactoryInput {
    id?: string;
    tenantId?: string | null;
    jobNumber?: string;
    materialTypeId?: string;
    thickness?: number;
    status?: CuttingJobStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare function createMockCuttingJob(input?: CuttingJobFactoryInput): {
    id: string;
    tenantId: string | null;
    jobNumber: string;
    materialTypeId: string;
    thickness: number;
    status: "IN_PRODUCTION" | "COMPLETED" | "PENDING" | "OPTIMIZING" | "OPTIMIZED";
    createdAt: Date;
    updatedAt: Date;
};
export interface StockItemFactoryInput {
    id?: string;
    tenantId?: string | null;
    code?: string;
    name?: string;
    materialTypeId?: string;
    thickness?: number;
    stockType?: StockType;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    quantity?: number;
    reservedQty?: number;
    unitPrice?: number | null;
    locationId?: string | null;
}
export declare function createMockStockItem(input?: StockItemFactoryInput): {
    id: string;
    tenantId: string | null;
    code: string;
    name: string;
    materialTypeId: string;
    thicknessRangeId: null;
    thickness: number;
    stockType: "BAR_1D" | "SHEET_2D";
    length: number;
    width: number;
    height: number | null;
    quantity: number;
    reservedQty: number;
    unitPrice: number;
    currencyId: null;
    locationId: string | null;
    isFromWaste: boolean;
    parentStockId: null;
    customFields: null;
    createdAt: Date;
    updatedAt: Date;
};
export interface StockMovementFactoryInput {
    id?: string;
    stockItemId?: string;
    movementType?: MovementType;
    quantity?: number;
    productionLogId?: string | null;
    notes?: string | null;
}
export declare function createMockStockMovement(input?: StockMovementFactoryInput): {
    id: string;
    stockItemId: string;
    movementType: "PURCHASE" | "CONSUMPTION" | "WASTE_REUSE" | "SCRAP" | "ADJUSTMENT" | "TRANSFER";
    quantity: number;
    productionLogId: string | null;
    notes: string | null;
    createdAt: Date;
};
export interface MaterialTypeFactoryInput {
    id?: string;
    name?: string;
    code?: string;
    description?: string | null;
    density?: number | null;
    isActive?: boolean;
}
export declare function createMockMaterialType(input?: MaterialTypeFactoryInput): {
    id: string;
    name: string;
    code: string;
    description: string | null;
    density: number | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export interface ScenarioFactoryInput {
    id?: string;
    tenantId?: string | null;
    name?: string;
    cuttingJobId?: string;
    createdById?: string;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
export declare function createMockScenario(input?: ScenarioFactoryInput): {
    id: string;
    tenantId: string | null;
    name: string;
    cuttingJobId: string;
    createdById: string;
    parameters: {};
    useWarehouseStock: boolean;
    useStandardSizes: boolean;
    selectedStockIds: null;
    status: "COMPLETED" | "PENDING" | "RUNNING" | "FAILED";
    createdAt: Date;
    updatedAt: Date;
};
export interface CuttingPlanFactoryInput {
    id?: string;
    planNumber?: string;
    scenarioId?: string;
    totalWaste?: number;
    wastePercentage?: number;
    stockUsedCount?: number;
    status?: PlanStatus;
    approvedById?: string | null;
    machineId?: string | null;
}
export declare function createMockCuttingPlan(input?: CuttingPlanFactoryInput): {
    id: string;
    planNumber: string;
    scenarioId: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
    estimatedTime: null;
    estimatedCost: null;
    status: "DRAFT" | "IN_PRODUCTION" | "COMPLETED" | "CANCELLED" | "APPROVED";
    approvedById: string | null;
    approvedAt: null;
    machineId: string | null;
    createdAt: Date;
    updatedAt: Date;
};
export interface UserFactoryInput {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    isActive?: boolean;
}
export declare function createMockUser(input?: UserFactoryInput): {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare function createMockUserWithRole(input?: UserFactoryInput): {
    role: {
        id: string;
        name: string;
        displayName: string;
        permissions: string[];
    };
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};
//# sourceMappingURL=test-factories.d.ts.map