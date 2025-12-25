"use strict";
/**
 * Test Factories
 * Typed mock object builders for unit tests
 * Eliminates need for `as any` casts in test files
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockOrder = createMockOrder;
exports.createMockOrderItem = createMockOrderItem;
exports.createMockCuttingJob = createMockCuttingJob;
exports.createMockStockItem = createMockStockItem;
exports.createMockStockMovement = createMockStockMovement;
exports.createMockMaterialType = createMockMaterialType;
exports.createMockScenario = createMockScenario;
exports.createMockCuttingPlan = createMockCuttingPlan;
exports.createMockUser = createMockUser;
exports.createMockUserWithRole = createMockUserWithRole;
function createMockOrder(input = {}) {
    return {
        id: input.id ?? `order-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        orderNumber: input.orderNumber ?? `ORD-${Date.now()}`,
        customerId: input.customerId ?? null,
        createdById: input.createdById ?? 'user-1',
        status: input.status ?? 'DRAFT',
        priority: input.priority ?? 5,
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null,
        customFields: null,
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date()
    };
}
function createMockOrderItem(input = {}) {
    return {
        id: input.id ?? `item-${Date.now()}`,
        orderId: input.orderId ?? 'order-1',
        itemCode: input.itemCode ?? 'ITEM-001',
        itemName: input.itemName ?? 'Test Item',
        geometryType: input.geometryType ?? 'RECTANGLE',
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
function createMockCuttingJob(input = {}) {
    return {
        id: input.id ?? `job-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        jobNumber: input.jobNumber ?? `JOB-${Date.now()}`,
        materialTypeId: input.materialTypeId ?? 'material-1',
        thickness: input.thickness ?? 18,
        status: input.status ?? 'PENDING',
        createdAt: input.createdAt ?? new Date(),
        updatedAt: input.updatedAt ?? new Date()
    };
}
function createMockStockItem(input = {}) {
    return {
        id: input.id ?? `stock-${Date.now()}`,
        tenantId: input.tenantId ?? null,
        code: input.code ?? `STK-${Date.now()}`,
        name: input.name ?? 'Test Stock',
        materialTypeId: input.materialTypeId ?? 'material-1',
        thicknessRangeId: null,
        thickness: input.thickness ?? 18,
        stockType: input.stockType ?? 'SHEET',
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
function createMockStockMovement(input = {}) {
    return {
        id: input.id ?? `movement-${Date.now()}`,
        stockItemId: input.stockItemId ?? 'stock-1',
        movementType: input.movementType ?? 'PURCHASE',
        quantity: input.quantity ?? 1,
        productionLogId: input.productionLogId ?? null,
        notes: input.notes ?? null,
        createdAt: new Date()
    };
}
function createMockMaterialType(input = {}) {
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
function createMockScenario(input = {}) {
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
function createMockCuttingPlan(input = {}) {
    return {
        id: input.id ?? `plan-${Date.now()}`,
        planNumber: input.planNumber ?? `PLN-${Date.now()}`,
        scenarioId: input.scenarioId ?? 'scenario-1',
        totalWaste: input.totalWaste ?? 0.5,
        wastePercentage: input.wastePercentage ?? 5,
        stockUsedCount: input.stockUsedCount ?? 3,
        estimatedTime: null,
        estimatedCost: null,
        status: input.status ?? 'DRAFT',
        approvedById: input.approvedById ?? null,
        approvedAt: null,
        machineId: input.machineId ?? null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
}
function createMockUser(input = {}) {
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
function createMockUserWithRole(input = {}) {
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
//# sourceMappingURL=test-factories.js.map