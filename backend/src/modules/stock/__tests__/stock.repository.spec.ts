import { StockRepository } from '../stock.repository';
import { createMockDatabase, MockProxy } from '../../../core/test/db-mock';
import { Database } from '../../../db';

describe('StockRepository', () => {
    let repository: StockRepository;
    let db: MockProxy<Database>;

    beforeEach(() => {
        db = createMockDatabase();
        repository = new StockRepository(db);
    });

    describe('create', () => {
        it('should create stock item', async () => {
            const input = {
                code: 'STK-001',
                name: 'MDF 18mm',
                materialTypeId: 'mat-1',
                thickness: 18,
                stockType: 'SHEET_2D',
                quantity: 10,
                unitPrice: 100
            };
            const mockItem = { id: 'item-1', ...input };

            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockItem])
                })
            });

            const result = await repository.create(input as any);

            expect(result.id).toBe('item-1');
            expect(result.code).toBe('STK-001');
        });
    });

    describe('updateQuantity', () => {
        it('should update quantity', async () => {
            const currentItem = { id: 'item-1', quantity: 10, reservedQty: 0 };
            const updatedItem = { id: 'item-1', quantity: 15, reservedQty: 0 };

            // Mock findFirst for current item lookup
            (db.query as any).stockItems.findFirst.mockResolvedValue(currentItem);

            (db.update as jest.Mock).mockReturnValue({
                set: jest.fn().mockReturnValue({
                    where: jest.fn().mockReturnValue({
                        returning: jest.fn().mockResolvedValue([updatedItem])
                    })
                })
            });

            const result = await repository.updateQuantity('item-1', 5);

            expect(result.quantity).toBe(15);
        });
    });

    describe('createMovement', () => {
        it('should create stock movement', async () => {
            const input = {
                stockItemId: 'item-1',
                movementType: 'PURCHASE',
                quantity: 10,
                notes: 'Test'
            };
            const mockMovement = { id: 'mov-1', ...input };

            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockMovement])
                })
            });

            const result = await repository.createMovement(input as any);

            expect(result.id).toBe('mov-1');
            expect(result.movementType).toBe('PURCHASE');
        });
    });
});
