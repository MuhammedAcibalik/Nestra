/**
 * Order Import Service
 * Following Single Responsibility Principle (SRP)
 * Responsible for Excel/CSV import operations only
 */
import { IResult, IColumnMapping, ICreateOrderInput } from '../../core/interfaces';
/**
 * Order Import Service Interface
 * Following Interface Segregation Principle (ISP)
 */
export interface IOrderImportService {
    /**
     * Import orders from Excel/CSV file
     */
    importFromFile(file: Buffer, mapping: IColumnMapping, userId: string): Promise<IResult<ICreateOrderInput>>;
}
/**
 * Order Import Service Implementation
 */
export declare class OrderImportService implements IOrderImportService {
    /**
     * Import orders from Excel/CSV file
     * Parses the file and creates order input data
     */
    importFromFile(file: Buffer, mapping: IColumnMapping, _userId: string): Promise<IResult<ICreateOrderInput>>;
    /**
     * Map Excel row to order item input
     */
    private mapRowToOrderItem;
    /**
     * Parse float number from cell value
     */
    private parseNumber;
    /**
     * Parse integer from cell value
     */
    private parseInt;
}
//# sourceMappingURL=order-import.service.d.ts.map