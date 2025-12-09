/**
 * Module Contract Types
 * Defines the public API contracts for each module
 * These are the ONLY types that can cross module boundaries
 *
 * Following Interface Segregation Principle (ISP)
 */
export interface IModuleHealth {
    module: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    details?: Record<string, unknown>;
}
export interface IModuleInfo {
    name: string;
    version: string;
    dependencies: string[];
}
export interface IUserContract {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}
export interface IAuthContract {
    authenticateToken(token: string): Promise<IUserContract | null>;
    validatePermission(userId: string, permission: string): Promise<boolean>;
}
export interface IMaterialTypeContract {
    id: string;
    name: string;
    isRotatable: boolean;
}
export interface IMaterialContract {
    getMaterialById(id: string): Promise<IMaterialTypeContract | null>;
    getAllMaterials(): Promise<IMaterialTypeContract[]>;
}
export interface IStockItemContract {
    id: string;
    code: string;
    name: string;
    materialTypeId: string;
    stockType: 'BAR_1D' | 'SHEET_2D';
    thickness: number;
    quantity: number;
    reservedQty: number;
    length?: number;
    width?: number;
    height?: number;
}
export interface IStockContract {
    getStockById(id: string): Promise<IStockItemContract | null>;
    getAvailableStock(materialTypeId: string, stockType: string): Promise<IStockItemContract[]>;
    consumeStock(stockId: string, quantity: number, reason: string): Promise<void>;
    reserveStock(stockId: string, quantity: number, planId: string): Promise<void>;
}
export interface IOrderContract {
    id: string;
    orderNumber: string;
    status: string;
    customerId?: string;
    itemCount: number;
}
export interface IOrderItemContract {
    id: string;
    orderId: string;
    geometryType: string;
    materialTypeId: string;
    thickness: number;
    quantity: number;
    length?: number;
    width?: number;
    height?: number;
}
export interface IOrderModuleContract {
    getOrderById(id: string): Promise<IOrderContract | null>;
    getOrderItems(orderId: string): Promise<IOrderItemContract[]>;
    updateOrderStatus(orderId: string, status: string): Promise<void>;
}
export interface IPlanContract {
    id: string;
    planNumber: string;
    scenarioId: string;
    status: string;
    totalWaste: number;
    wastePercentage: number;
    stockUsedCount: number;
}
export interface IOptimizationContract {
    getPlanById(id: string): Promise<IPlanContract | null>;
    updatePlanStatus(id: string, status: string): Promise<void>;
    getApprovedPlans(): Promise<IPlanContract[]>;
}
export interface IProductionLogContract {
    id: string;
    planId: string;
    operatorId: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
}
export interface IProductionContract {
    startProduction(planId: string, operatorId: string): Promise<IProductionLogContract>;
    completeProduction(logId: string, data: {
        actualWaste: number;
        actualTime: number;
    }): Promise<void>;
}
export interface ICustomerContract {
    id: string;
    code: string;
    name: string;
    email?: string;
    phone?: string;
}
export interface ICustomerModuleContract {
    getCustomerById(id: string): Promise<ICustomerContract | null>;
    getAllCustomers(): Promise<ICustomerContract[]>;
}
export interface IMachineContract {
    id: string;
    code: string;
    name: string;
    machineType: string;
    kerf?: number;
    isActive: boolean;
}
export interface IMachineModuleContract {
    getMachineById(id: string): Promise<IMachineContract | null>;
    getActiveMachines(): Promise<IMachineContract[]>;
}
//# sourceMappingURL=module-contracts.d.ts.map