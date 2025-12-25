/**
 * Test Factories
 * Typed mock object builders for unit tests
 * Eliminates need for `as any` casts in test files
 */

import {
    GeometryType,
    OrderStatus,
    CuttingJobStatus,
    StockType,
    MovementType,
    PlanStatus
} from '../../db/schema/enums';

// ==================== ORDER FACTORIES ====================

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

export function createMockOrder(input: OrderFactoryInput = {}) {
    return {
        id: input.id ?? `order-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        orderNumber: input.orderNumber ?? `ORD-${Date.now()}`,
        customerId: input.customerId ?? null,
        createdById: input.createdById ?? 'user-1',
        status: input.status ?? ('DRAFT' as OrderStatus),
        priority: input.priority ?? 5,
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null,
        customFields: null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date()
    };
}

// ==================== ORDER ITEM FACTORIES ====================

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

export function createMockOrderItem(input: OrderItemFactoryInput = {}) {
    return {
        id: input.id ?? `item-${Date.now()}`,
        orderId: input.orderId ?? 'order-1',
        itemCode: input.itemCode ?? 'ITEM-001',
        itemName: input.itemName ?? 'Test Item',
        geometryType: input.geometryType ?? ('RECTANGLE' as GeometryType),
        length: input.length ?? 100,
        width: input.width ?? 50,
        height: input.height ?? null,
        diameter: input.diameter ?? null,
        polygonData: null,
        materialTypeId: input.materialTypeId ?? 'material-1',
        thickness: input.thickness ?? 18,
        quantity: input.quantity ?? 1,
        producedQty: input.producedQty ?? 0,
        canRotate: input.canRotate ?? true,
        grainDirection: null,
        customFields: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// ==================== CUTTING JOB FACTORIES ====================

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

export function createMockCuttingJob(input: CuttingJobFactoryInput = {}) {
    return {
        id: input.id ?? `job-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        jobNumber: input.jobNumber ?? `JOB-${Date.now()}`,
        materialTypeId: input.materialTypeId ?? 'material-1',
        thickness: input.thickness ?? 18,
        status: input.status ?? ('PENDING' as CuttingJobStatus),
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date()
    };
}

// ==================== STOCK FACTORIES ====================

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

export function createMockStockItem(input: StockItemFactoryInput = {}) {
    return {
        id: input.id ?? `stock-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        code: input.code ?? `STK-${Date.now()}`,
        name: input.name ?? 'Test Stock',
        materialTypeId: input.materialTypeId ?? 'material-1',
        thicknessRangeId: null,
        thickness: input.thickness ?? 18,
        stockType: input.stockType ?? ('SHEET' as StockType),
        length: input.length ?? 2440,
        width: input.width ?? 1220,
        height: input.height ?? null,
        quantity: input.quantity ?? 10,
        reservedQty: input.reservedQty ?? 0,
        unitPrice: input.unitPrice ?? 100,
        currencyId: null,
        locationId: input.locationId ?? null,
        isFromWaste: false,
        parentStockId: null,
        customFields: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

export interface StockMovementFactoryInput {
    id?: string;
    stockItemId?: string;
    movementType?: MovementType;
    quantity?: number;
    productionLogId?: string | null;
    notes?: string | null;
}

export function createMockStockMovement(input: StockMovementFactoryInput = {}) {
    return {
        id: input.id ?? `movement-${Date.now()}`,
        stockItemId: input.stockItemId ?? 'stock-1',
        movementType: input.movementType ?? ('PURCHASE' as MovementType),
        quantity: input.quantity ?? 1,
        productionLogId: input.productionLogId ?? null,
        notes: input.notes ?? null,
        createdAt: new Date()
    };
}

// ==================== MATERIAL FACTORIES ====================

export interface MaterialTypeFactoryInput {
    id?: string;
    name?: string;
    code?: string;
    description?: string | null;
    density?: number | null;
    isActive?: boolean;
}

export function createMockMaterialType(input: MaterialTypeFactoryInput = {}) {
    return {
        id: input.id ?? `material-${Date.now()}`,
        name: input.name ?? 'MDF',
        code: input.code ?? 'MDF-18',
        description: input.description ?? null,
        density: input.density ?? null,
        isActive: input.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// ==================== OPTIMIZATION FACTORIES ====================

export interface ScenarioFactoryInput {
    id?: string;
    tenantId?: string | null;
    name?: string;
    cuttingJobId?: string;
    createdById?: string;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export function createMockScenario(input: ScenarioFactoryInput = {}) {
    return {
        id: input.id ?? `scenario-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        name: input.name ?? 'Test Scenario',
        cuttingJobId: input.cuttingJobId ?? 'job-1',
        createdById: input.createdById ?? 'user-1',
        parameters: {},
        useWarehouseStock: true,
        useStandardSizes: true,
        selectedStockIds: null,
        status: input.status ?? 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

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

export function createMockCuttingPlan(input: CuttingPlanFactoryInput = {}) {
    return {
        id: input.id ?? `plan-${Date.now()}`,
        planNumber: input.planNumber ?? `PLN-${Date.now()}`,
        scenarioId: input.scenarioId ?? 'scenario-1',
        totalWaste: input.totalWaste ?? 0.5,
        wastePercentage: input.wastePercentage ?? 5,
        stockUsedCount: input.stockUsedCount ?? 3,
        estimatedTime: null,
        estimatedCost: null,
        status: input.status ?? ('DRAFT' as PlanStatus),
        approvedById: input.approvedById ?? null,
        approvedAt: null,
        machineId: input.machineId ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

// ==================== USER FACTORIES ====================

export interface UserFactoryInput {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    isActive?: boolean;
}

export function createMockUser(input: UserFactoryInput = {}) {
    return {
        id: input.id ?? `user-${Date.now()}`,
        email: input.email ?? 'test@example.com',
        passwordHash: '$2b$10$mockHash',
        firstName: input.firstName ?? 'Test',
        lastName: input.lastName ?? 'User',
        roleId: input.roleId ?? 'role-1',
        isActive: input.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}

export function createMockUserWithRole(input: UserFactoryInput = {}) {
    return {
        ...createMockUser(input),
        role: {
            id: input.roleId ?? 'role-1',
            name: 'admin',
            displayName: 'Administrator',
            permissions: ['*']
        }
    };
}
