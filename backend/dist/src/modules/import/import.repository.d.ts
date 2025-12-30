/**
 * Import Repository
 * Migrated to Drizzle ORM
 */
import { Database } from '../../db';
export interface IStockItemImport {
    code: string;
    name: string;
    materialTypeId: string;
    stockType: 'BAR_1D' | 'SHEET_2D';
    thickness: number;
    length?: number;
    width?: number;
    height?: number;
    quantity: number;
    unitPrice?: number;
    locationId?: string;
}
export interface IMaterialImport {
    name: string;
    description?: string;
    defaultDensity?: number;
}
export interface ICustomerImport {
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}
export interface IOrderWithItemsInput {
    orderNumber: string;
    customerId?: string;
    createdById: string;
    priority?: number;
    dueDate?: Date;
    notes?: string;
    items: Array<{
        itemCode?: string;
        itemName?: string;
        geometryType: string;
        length?: number;
        width?: number;
        height?: number;
        diameter?: number;
        materialTypeId: string;
        thickness: number;
        quantity: number;
        canRotate?: boolean;
    }>;
}
export interface IImportRepository {
    importStockItems(data: IStockItemImport[]): Promise<number>;
    importMaterials(data: IMaterialImport[]): Promise<number>;
    importCustomers(data: ICustomerImport[]): Promise<number>;
    getOrderCount(): Promise<number>;
    createOrderWithItems(data: IOrderWithItemsInput): Promise<{
        id: string;
        orderNumber: string;
    }>;
    findMaterialByCode(code: string): Promise<{
        id: string;
        name: string;
    } | null>;
    generateOrderNumber(): Promise<string>;
}
export declare class ImportRepository implements IImportRepository {
    private readonly db;
    constructor(db: Database);
    importStockItems(data: IStockItemImport[]): Promise<number>;
    importMaterials(data: IMaterialImport[]): Promise<number>;
    importCustomers(data: ICustomerImport[]): Promise<number>;
    getOrderCount(): Promise<number>;
    /**
     * Find material type by code for import mapping
     */
    findMaterialByCode(code: string): Promise<{
        id: string;
        name: string;
    } | null>;
    /**
     * Generate atomic order number using database sequence
     * Race-condition safe - uses MAX with lock
     */
    generateOrderNumber(): Promise<string>;
    createOrderWithItems(data: IOrderWithItemsInput): Promise<{
        id: string;
        orderNumber: string;
    }>;
}
//# sourceMappingURL=import.repository.d.ts.map