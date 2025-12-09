import { ImportService } from '../import.service';
import { createMockContext, MockContext } from '../../../core/test/prisma-mock';
import xlsx from 'xlsx';

// Mock xlsx
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn()
    },
    SheetNames: [],
    Sheets: {}
}));

describe('ImportService', () => {
    let service: ImportService;
    let mockCtx: MockContext;

    beforeEach(() => {
        mockCtx = createMockContext();
        service = new ImportService(mockCtx.prisma);
    });

    describe('detectFileType', () => {
        it('should detect file types correctly', () => {
            expect(service.detectFileType('test.xlsx')).toBe('excel');
            expect(service.detectFileType('test.xls')).toBe('excel');
            expect(service.detectFileType('test.csv')).toBe('csv');
            expect(service.detectFileType('test.txt')).toBe('unknown');
        });
    });

    describe('suggestMapping', () => {
        it('should suggest mapping based on headers', () => {
            const headers = ['Material', 'Thickness', 'Quantity', 'Length', 'Width'];
            const mapping = service.suggestMapping(headers);
            console.log('DEBUG MAPPING:', JSON.stringify(mapping, null, 2));

            expect(mapping.materialCode).toBe('Material');
            expect(mapping.thickness).toBe('Thickness');
            expect(mapping.quantity).toBe('Quantity');
            expect(mapping.length).toBe('Length');
            expect(mapping.width).toBe('Width');
        });
    });

    describe('importFromExcel', () => {
        it('should import order from excel data', async () => {
            // Mock xlsx behavior
            (xlsx.read as jest.Mock).mockReturnValue({
                SheetNames: ['Sheet1'],
                Sheets: { 'Sheet1': {} }
            });
            (xlsx.utils.sheet_to_json as jest.Mock).mockReturnValue([
                { 'Malzeme': 'MDF', 'Kalınlık': 18, 'Adet': 2, 'Boy': 100, 'En': 50 }
            ]);

            mockCtx.prisma.order.count.mockResolvedValue(0);
            mockCtx.prisma.order.create.mockResolvedValue({
                id: 'order-1',
                orderNumber: 'ORD-2023-00001'
            } as any);

            const buffer = Buffer.from('');
            const options = {
                mapping: {
                    materialCode: 'Malzeme',
                    thickness: 'Kalınlık',
                    quantity: 'Adet',
                    length: 'Boy',
                    width: 'En'
                }
            };

            const result = await service.importFromExcel(buffer, options, 'user-1');

            expect(result.success).toBe(true);
            expect(result.data?.importedItems).toBe(1);
            expect(mockCtx.prisma.order.create).toHaveBeenCalled();
        });
    });
});
